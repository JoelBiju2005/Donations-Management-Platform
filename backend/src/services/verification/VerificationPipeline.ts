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
import { runGeminiVisionAnalysis, GeminiVisionResult } from './stages/GeminiVision';
import { automateSuccessfulDonationReceipt } from '../receipt/receiptAutomation';
import { PipelineResult, VerificationConfig, VerificationDecision } from './types';
import { logger } from '../../core/logger';

/**
 * Helper to determine MIME type based on file extension
 */
function getMimeTypeFromUrl(url: string): string {
  if (url.toLowerCase().endsWith('.png')) {
    return 'image/png';
  }
  return 'image/jpeg';
}

/**
 * Verification Pipeline Orchestrator
 * Uses Google Gemini 2.5 Flash Vision for primary verification.
 * Falls back to Tesseract OCR + Heuristics when Gemini is unavailable or fails.
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

  // Load verification config from settings
  const settings = await getTempleSettings();
  const config: VerificationConfig = {
    ocrConfidenceThreshold: settings.verificationConfig.ocrConfidenceThreshold,
    fraudRiskThreshold: settings.verificationConfig.fraudRiskThreshold,
    timestampMaxAgeHours: settings.verificationConfig.timestampMaxAgeHours,
    amountMismatchTolerancePaise: settings.verificationConfig.amountMismatchTolerancePaise,
    autoApproveEnabled: settings.verificationConfig.autoApproveEnabled,
    requireManualReviewAboveAmount: settings.verificationConfig.requireManualReviewAboveAmount,
  };

  // Load the image buffer from S3/Storage
  const storage = getStorageProvider();
  let imageBuffer: Buffer;
  try {
    imageBuffer = await storage.getBuffer(donation.screenshotUrl);
  } catch (error) {
    log.error({ error, screenshotUrl: donation.screenshotUrl }, 'Failed to load screenshot from storage');
    throw new Error('Failed to load payment screenshot for verification');
  }

  const mimetype = getMimeTypeFromUrl(donation.screenshotUrl);

  let decision: VerificationDecision = 'pending_admin_review';
  const reasons: string[] = [];
  let overallConfidence = 0;

  // Structured response containers to keep compatible with database schema
  let geminiVisionResult: GeminiVisionResult | null = null;
  let ocrResultObj = { rawText: '', confidence: 0 };
  let extractionFieldsObj: any = {};
  let fraudAnalysisObj = { riskScore: 0, signals: [] as string[], flagged: false };

  // --- Attempt Gemini 2.5 Flash Vision ---
  try {
    geminiVisionResult = await runGeminiVisionAnalysis(imageBuffer, mimetype);

    log.info({ geminiVisionResult }, 'Gemini Vision analysis succeeded');

    // Extract fields
    extractionFieldsObj = {
      transactionId: geminiVisionResult.transactionId,
      senderName: geminiVisionResult.senderName,
      receiverName: geminiVisionResult.receiverName,
      date: geminiVisionResult.paymentDate,
      time: geminiVisionResult.paymentTime,
      amount: geminiVisionResult.amount,
      status: geminiVisionResult.isPaymentSuccessful ? 'Success' : 'Failed',
    };

    overallConfidence = geminiVisionResult.screenshotConfidence;

    // Check manual review criteria
    const isConfidenceLow = geminiVisionResult.screenshotConfidence < 90;
    const isManipulationSuspected = geminiVisionResult.possibleManipulation === true;
    const isMandatoryInfoMissing =
      !geminiVisionResult.transactionId ||
      !geminiVisionResult.amount ||
      !geminiVisionResult.paymentDate;

    if (isConfidenceLow) {
      reasons.push(`Low confidence score (${geminiVisionResult.screenshotConfidence}%) returned by AI vision`);
    }
    if (isManipulationSuspected) {
      reasons.push(`Screenshot manipulation or forgery suspected: ${geminiVisionResult.reason}`);
    }
    if (isMandatoryInfoMissing) {
      reasons.push('Mandatory transaction information is missing or unreadable on the receipt');
    }

    if (isConfidenceLow || isManipulationSuspected || isMandatoryInfoMissing) {
      // Do NOT automatically reject - Place inside Admin Review Queue
      decision = 'pending_admin_review';
      log.info({ isConfidenceLow, isManipulationSuspected, isMandatoryInfoMissing }, 'Flagging for manual review due to verification anomalies');
    } else if (!geminiVisionResult.isPaymentSuccessful) {
      // Reject if status is explicitly failed
      decision = 'rejected';
      reasons.push('Payment status on the receipt indicates the transaction failed');
    } else {
      // Reconcile amounts
      const amountDiff = Math.abs(donation.amount - (geminiVisionResult.amount || 0));
      const amountMatched = amountDiff <= config.amountMismatchTolerancePaise;

      if (!amountMatched) {
        decision = 'pending_admin_review';
        reasons.push(`Amount mismatch: declared ₹${(donation.amount / 100).toFixed(2)}, extracted ₹${((geminiVisionResult.amount || 0) / 100).toFixed(2)}`);
      } else {
        // Auto approval if enabled
        if (config.autoApproveEnabled) {
          decision = 'verified';
          reasons.push('AI verified successfully — Auto-approved');
        } else {
          decision = 'pending_admin_review';
          reasons.push('Verification checks passed, awaiting manual admin release settings');
        }
      }
    }

    ocrResultObj = {
      rawText: geminiVisionResult.reason,
      confidence: geminiVisionResult.screenshotConfidence,
    };

    fraudAnalysisObj = {
      riskScore: geminiVisionResult.possibleManipulation ? 85 : 5,
      signals: geminiVisionResult.possibleManipulation ? [geminiVisionResult.reason] : [],
      flagged: geminiVisionResult.possibleManipulation,
    };

  } catch (geminiError: any) {
    // --- Fallback to Tesseract OCR when Gemini fails ---
    log.warn({ error: geminiError.message }, 'Gemini Vision failed or key missing — falling back to Tesseract OCR');

    reasons.push('Gemini AI failed, using fallback OCR processing');

    // Run fallback stages in parallel
    const [ocrResult, fraudResult] = await Promise.all([
      runOcrExtraction(imageBuffer, config.ocrConfidenceThreshold),
      runFraudDetection(imageBuffer, donation.screenshotHash, donationId, config.fraudRiskThreshold),
    ]);

    ocrResultObj = {
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
    };

    fraudAnalysisObj = {
      riskScore: fraudResult.riskScore,
      signals: fraudResult.signals.filter((s) => s.detected).map((s) => s.description),
      flagged: fraudResult.flagged,
    };

    const extractionResult = runFinancialExtraction(ocrResult.rawText);
    extractionFieldsObj = extractionResult.fields;

    const amountResult = runAmountReconciliation(
      donation.amount,
      extractionResult.fields.amount,
      config.amountMismatchTolerancePaise
    );

    const transactionResult = runTransactionValidation(extractionResult.fields);
    const timestampResult = runTimestampValidation(
      extractionResult.fields,
      config.timestampMaxAgeHours
    );

    // Call decision engine
    const fallbackDecision = makeVerificationDecision(
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

    decision = fallbackDecision.decision;
    overallConfidence = fallbackDecision.overallConfidence;
    reasons.push(...fallbackDecision.reasons);
  }

  // Define full pipeline result structured package
  const pipelineResult: PipelineResult = {
    decision,
    reasons,
    overallConfidence,
    ocr: {
      rawText: ocrResultObj.rawText,
      confidence: ocrResultObj.confidence,
      wordConfidences: [],
      passed: ocrResultObj.confidence >= config.ocrConfidenceThreshold,
    },
    extraction: {
      fields: extractionFieldsObj,
      confidence: overallConfidence,
      passed: !!extractionFieldsObj.transactionId,
    },
    amountReconciliation: {
      declaredAmount: donation.amount,
      extractedAmount: extractionFieldsObj.amount,
      matched: Math.abs(donation.amount - (extractionFieldsObj.amount || 0)) <= config.amountMismatchTolerancePaise,
      passed: Math.abs(donation.amount - (extractionFieldsObj.amount || 0)) <= config.amountMismatchTolerancePaise,
    },
    fraudDetection: {
      riskScore: fraudAnalysisObj.riskScore,
      signals: [],
      flagged: fraudAnalysisObj.flagged,
      passed: !fraudAnalysisObj.flagged,
    },
    transactionValidation: {
      isSuccessful: extractionFieldsObj.status === 'Success',
      formatValid: true,
      passed: true,
    },
    timestampValidation: {
      serverTimestamp: new Date(),
      isFuture: false,
      isTooOld: false,
      passed: true,
    },
    processedAt: new Date(),
  };

  // --- Save results to donation document ---
  donation.ocr = ocrResultObj;
  donation.extractedFields = extractionFieldsObj;
  donation.fraudAnalysis = fraudAnalysisObj;
  donation.verification = {
    result: decision,
    reasons,
    pipelineOutput: pipelineResult as any,
  };

  // Set status based on decision
  switch (decision) {
    case 'verified':
      donation.status = 'successful';
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

  // If verified successful, automate receipt generation & email delivery in S3
  if (donation.status === 'successful') {
    await automateSuccessfulDonationReceipt(donation);
  }

  const elapsed = Date.now() - startTime;
  log.info(
    { decision, overallConfidence, elapsed: `${elapsed}ms`, receiptNumber: donation.receipt?.receiptNumber },
    'Verification pipeline completed'
  );

  return pipelineResult;
}
