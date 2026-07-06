import { Donation } from '../../models/Donation';
import { getTempleSettings } from '../../models/TempleSettings';
import { getNextReceiptNumber } from '../../models/Counter';
import { getStorageProvider } from '../../services/storage';
import { runOcrExtraction } from './stages/OcrExtraction';
import { runFinancialExtraction } from './stages/FinancialExtraction';
import { runAmountReconciliation } from './stages/AmountReconciliation';
import { runFraudDetection } from './stages/FraudDetection';
import { runTransactionValidation } from './stages/TransactionValidation';
import { runTimestampValidation } from './stages/TimestampValidation';
import { makeVerificationDecision } from './DecisionEngine';
import { PipelineResult, VerificationConfig } from './types';
import { logger } from '../../core/logger';

/**
 * Verification Pipeline Orchestrator
 * Runs all 6 stages sequentially (OCR must complete before extraction)
 * and fraud detection in parallel, then feeds results to the decision engine.
 */
export async function runVerificationPipeline(donationId: string): Promise<PipelineResult> {
  const startTime = Date.now();
  const log = logger.child({ donationId, pipeline: 'verification' });

  log.info('Starting verification pipeline');

  // Load donation
  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw new Error(`Donation ${donationId} not found`);
  }

  // Load verification config from settings (admin-editable thresholds)
  const settings = await getTempleSettings();
  const config: VerificationConfig = {
    ocrConfidenceThreshold: settings.verificationConfig.ocrConfidenceThreshold,
    fraudRiskThreshold: settings.verificationConfig.fraudRiskThreshold,
    timestampMaxAgeHours: settings.verificationConfig.timestampMaxAgeHours,
    amountMismatchTolerancePaise: settings.verificationConfig.amountMismatchTolerancePaise,
    autoApproveEnabled: settings.verificationConfig.autoApproveEnabled,
    requireManualReviewAboveAmount: settings.verificationConfig.requireManualReviewAboveAmount,
  };

  // Load the image buffer from storage
  const storage = getStorageProvider();
  let imageBuffer: Buffer;
  try {
    imageBuffer = await storage.getBuffer(donation.screenshotUrl);
  } catch (error) {
    log.error({ error, screenshotUrl: donation.screenshotUrl }, 'Failed to load screenshot');
    throw new Error('Failed to load payment screenshot for verification');
  }

  // ─── Stage 1 & 4 in parallel (fraud detection doesn't depend on OCR) ───
  const [ocrResult, fraudResult] = await Promise.all([
    runOcrExtraction(imageBuffer, config.ocrConfidenceThreshold),
    runFraudDetection(imageBuffer, donation.screenshotHash, donationId, config.fraudRiskThreshold),
  ]);

  log.debug({ ocrConfidence: ocrResult.confidence, fraudRisk: fraudResult.riskScore }, 'OCR + Fraud complete');

  // ─── Stage 2: Financial Extraction (depends on OCR) ───
  const extractionResult = runFinancialExtraction(ocrResult.rawText);

  // ─── Stage 3: Amount Reconciliation ───
  const amountResult = runAmountReconciliation(
    donation.amount,
    extractionResult.fields.amount,
    config.amountMismatchTolerancePaise
  );

  // ─── Stage 5: Transaction Validation ───
  const transactionResult = runTransactionValidation(extractionResult.fields);

  // ─── Stage 6: Timestamp Validation ───
  const timestampResult = runTimestampValidation(
    extractionResult.fields,
    config.timestampMaxAgeHours
  );

  // ─── Decision Engine ───
  const { decision, reasons, overallConfidence } = makeVerificationDecision(
    {
      ocr: ocrResult,
      extraction: extractionResult,
      amountReconciliation: amountResult,
      fraudDetection: fraudResult,
      transactionValidation: transactionResult,
      timestampValidation: timestampResult,
    },
    config
  );

  const pipelineResult: PipelineResult = {
    decision,
    reasons,
    overallConfidence,
    ocr: ocrResult,
    extraction: extractionResult,
    amountReconciliation: amountResult,
    fraudDetection: fraudResult,
    transactionValidation: transactionResult,
    timestampValidation: timestampResult,
    processedAt: new Date(),
  };

  // ─── Update donation record with full pipeline results ───
  donation.ocr = {
    rawText: ocrResult.rawText,
    confidence: ocrResult.confidence,
  };
  donation.extractedFields = extractionResult.fields;
  donation.fraudAnalysis = {
    riskScore: fraudResult.riskScore,
    signals: fraudResult.signals.filter((s) => s.detected).map((s) => s.description),
    flagged: fraudResult.flagged,
  };
  donation.verification = {
    result: decision,
    reasons,
    pipelineOutput: pipelineResult as any,
  };

  // Set status based on decision
  switch (decision) {
    case 'verified':
      donation.status = 'successful';
      // Generate receipt
      const receiptNumber = await getNextReceiptNumber();
      donation.receipt = {
        receiptNumber,
        generatedAt: new Date(),
      };
      break;
    case 'rejected':
      donation.status = 'rejected';
      break;
    case 'pending_admin_review':
      donation.status = 'pending_admin_review';
      break;
  }

  await donation.save();

  const elapsed = Date.now() - startTime;
  log.info(
    { decision, overallConfidence, elapsed: `${elapsed}ms`, receiptNumber: donation.receipt?.receiptNumber },
    'Verification pipeline complete'
  );

  return pipelineResult;
}
