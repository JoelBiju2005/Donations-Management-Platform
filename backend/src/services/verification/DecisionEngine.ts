import { PipelineResult, VerificationConfig, VerificationDecision } from './types';
import { logger } from '../../core/logger';

/**
 * Decision Engine — combines all 6 stage results into a single verification decision.
 *
 * Logic:
 * - Hard rejection: fraud detected (duplicate, editing software), payment failed, future timestamp
 * - Auto-approve: all checks pass and auto-approve is enabled
 * - Admin review: borderline confidence, amount mismatch, or missing data
 */
export function makeVerificationDecision(
  pipeline: Omit<PipelineResult, 'decision' | 'reasons' | 'overallConfidence' | 'processedAt'>,
  config: VerificationConfig
): { decision: VerificationDecision; reasons: string[]; overallConfidence: number } {
  const reasons: string[] = [];
  let decision: VerificationDecision = 'verified';

  // ─── Hard Rejection Criteria ─────────────────────────────

  // Fraud: duplicate screenshot is an instant rejection
  const hasDuplicate = pipeline.fraudDetection.signals.some(
    (s: any) => s.type === 'duplicate_screenshot' && s.detected
  );
  if (hasDuplicate) {
    reasons.push('This payment screenshot has been previously submitted.');
    decision = 'rejected';
  }

  // Fraud: editing software detected
  const hasEditingSoftware = pipeline.fraudDetection.signals.some(
    (s: any) => s.type === 'editing_software' && s.detected
  );
  if (hasEditingSoftware) {
    reasons.push('The screenshot appears to have been processed with image editing software.');
    decision = 'rejected';
  }

  // Transaction showed as failed/declined
  if (pipeline.transactionValidation.statusText && !pipeline.transactionValidation.isSuccessful) {
    reasons.push('The payment status indicates the transaction was not successful.');
    decision = 'rejected';
  }

  // Future timestamp
  if (pipeline.timestampValidation.isFuture) {
    reasons.push('The payment timestamp is in the future.');
    decision = 'rejected';
  }

  // If already rejected, return immediately
  if (decision === 'rejected') {
    return { decision, reasons, overallConfidence: 0 };
  }

  // ─── Calculate Overall Confidence ────────────────────────

  let confidenceScore = 0;
  let maxScore = 0;

  // OCR confidence (weight: 25%)
  maxScore += 25;
  if (pipeline.ocr.passed) {
    confidenceScore += 25 * (pipeline.ocr.confidence / 100);
  }

  // Financial extraction (weight: 20%)
  maxScore += 20;
  if (pipeline.extraction.passed) {
    confidenceScore += 20 * (pipeline.extraction.confidence / 100);
  }

  // Amount match (weight: 25%)
  maxScore += 25;
  if (pipeline.amountReconciliation.passed) {
    confidenceScore += 25;
  } else if (pipeline.amountReconciliation.extractedAmount === undefined) {
    // Amount couldn't be extracted — partial penalty
    confidenceScore += 5;
  }

  // Fraud clean (weight: 15%)
  maxScore += 15;
  if (pipeline.fraudDetection.passed) {
    confidenceScore += 15;
  } else {
    confidenceScore += 15 * Math.max(0, (100 - pipeline.fraudDetection.riskScore) / 100);
  }

  // Transaction valid (weight: 10%)
  maxScore += 10;
  if (pipeline.transactionValidation.passed) {
    confidenceScore += 10;
  }

  // Timestamp valid (weight: 5%)
  maxScore += 5;
  if (pipeline.timestampValidation.passed) {
    confidenceScore += 5;
  }

  const overallConfidence = Math.round((confidenceScore / maxScore) * 100);

  // ─── Decision Logic ──────────────────────────────────────

  // Check if amount is above manual review threshold
  if (pipeline.amountReconciliation.declaredAmount > config.requireManualReviewAboveAmount) {
    reasons.push('Donation amount exceeds the automatic approval threshold.');
    decision = 'pending_admin_review';
  }

  // Timestamp too old
  if (pipeline.timestampValidation.isTooOld) {
    reasons.push('The payment screenshot is older than the accepted time window.');
    decision = 'pending_admin_review';
  }

  // Amount mismatch
  if (!pipeline.amountReconciliation.passed && pipeline.amountReconciliation.extractedAmount !== undefined) {
    reasons.push('The extracted amount does not match the declared donation amount.');
    decision = 'pending_admin_review';
  }

  // High fraud risk (but not hard rejection)
  if (pipeline.fraudDetection.riskScore > config.fraudRiskThreshold * 0.7 && !pipeline.fraudDetection.flagged) {
    reasons.push('Some verification checks raised minor concerns.');
    decision = 'pending_admin_review';
  }

  // Low overall confidence
  if (overallConfidence < 60) {
    reasons.push('Overall verification confidence is below the acceptable threshold.');
    decision = 'pending_admin_review';
  }

  // If everything passes and auto-approve is enabled
  if (decision === 'verified' && !config.autoApproveEnabled) {
    reasons.push('Auto-approval is disabled — all donations require manual review.');
    decision = 'pending_admin_review';
  }

  if (decision === 'verified') {
    reasons.push('All verification checks passed successfully.');
  }

  logger.info(
    { decision, overallConfidence, reasonCount: reasons.length },
    'Verification decision made'
  );

  return { decision, reasons, overallConfidence };
}
