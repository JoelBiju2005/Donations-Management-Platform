"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVerificationPipeline = runVerificationPipeline;
const Donation_1 = require("../../models/Donation");
const TempleSettings_1 = require("../../models/TempleSettings");
const Counter_1 = require("../../models/Counter");
const storage_1 = require("../../services/storage");
const OcrExtraction_1 = require("./stages/OcrExtraction");
const FinancialExtraction_1 = require("./stages/FinancialExtraction");
const AmountReconciliation_1 = require("./stages/AmountReconciliation");
const FraudDetection_1 = require("./stages/FraudDetection");
const TransactionValidation_1 = require("./stages/TransactionValidation");
const TimestampValidation_1 = require("./stages/TimestampValidation");
const DecisionEngine_1 = require("./DecisionEngine");
const logger_1 = require("../../core/logger");
/**
 * Verification Pipeline Orchestrator
 * Runs all 6 stages sequentially (OCR must complete before extraction)
 * and fraud detection in parallel, then feeds results to the decision engine.
 */
async function runVerificationPipeline(donationId) {
    const startTime = Date.now();
    const log = logger_1.logger.child({ donationId, pipeline: 'verification' });
    log.info('Starting verification pipeline');
    // Load donation
    const donation = await Donation_1.Donation.findById(donationId);
    if (!donation) {
        throw new Error(`Donation ${donationId} not found`);
    }
    // Load verification config from settings (admin-editable thresholds)
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    const config = {
        ocrConfidenceThreshold: settings.verificationConfig.ocrConfidenceThreshold,
        fraudRiskThreshold: settings.verificationConfig.fraudRiskThreshold,
        timestampMaxAgeHours: settings.verificationConfig.timestampMaxAgeHours,
        amountMismatchTolerancePaise: settings.verificationConfig.amountMismatchTolerancePaise,
        autoApproveEnabled: settings.verificationConfig.autoApproveEnabled,
        requireManualReviewAboveAmount: settings.verificationConfig.requireManualReviewAboveAmount,
    };
    // Load the image buffer from storage
    const storage = (0, storage_1.getStorageProvider)();
    let imageBuffer;
    try {
        imageBuffer = await storage.getBuffer(donation.screenshotUrl);
    }
    catch (error) {
        log.error({ error, screenshotUrl: donation.screenshotUrl }, 'Failed to load screenshot');
        throw new Error('Failed to load payment screenshot for verification');
    }
    // ─── Stage 1 & 4 in parallel (fraud detection doesn't depend on OCR) ───
    const [ocrResult, fraudResult] = await Promise.all([
        (0, OcrExtraction_1.runOcrExtraction)(imageBuffer, config.ocrConfidenceThreshold),
        (0, FraudDetection_1.runFraudDetection)(imageBuffer, donation.screenshotHash, donationId, config.fraudRiskThreshold),
    ]);
    log.debug({ ocrConfidence: ocrResult.confidence, fraudRisk: fraudResult.riskScore }, 'OCR + Fraud complete');
    // ─── Stage 2: Financial Extraction (depends on OCR) ───
    const extractionResult = (0, FinancialExtraction_1.runFinancialExtraction)(ocrResult.rawText);
    // ─── Stage 3: Amount Reconciliation ───
    const amountResult = (0, AmountReconciliation_1.runAmountReconciliation)(donation.amount, extractionResult.fields.amount, config.amountMismatchTolerancePaise);
    // ─── Stage 5: Transaction Validation ───
    const transactionResult = (0, TransactionValidation_1.runTransactionValidation)(extractionResult.fields);
    // ─── Stage 6: Timestamp Validation ───
    const timestampResult = (0, TimestampValidation_1.runTimestampValidation)(extractionResult.fields, config.timestampMaxAgeHours);
    // ─── Decision Engine ───
    const { decision, reasons, overallConfidence } = (0, DecisionEngine_1.makeVerificationDecision)({
        ocr: ocrResult,
        extraction: extractionResult,
        amountReconciliation: amountResult,
        fraudDetection: fraudResult,
        transactionValidation: transactionResult,
        timestampValidation: timestampResult,
    }, config);
    const pipelineResult = {
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
        pipelineOutput: pipelineResult,
    };
    // Set status based on decision
    switch (decision) {
        case 'verified':
            donation.status = 'successful';
            // Generate receipt
            const receiptNumber = await (0, Counter_1.getNextReceiptNumber)();
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
    log.info({ decision, overallConfidence, elapsed: `${elapsed}ms`, receiptNumber: donation.receipt?.receiptNumber }, 'Verification pipeline complete');
    return pipelineResult;
}
//# sourceMappingURL=VerificationPipeline.js.map