/**
 * Type definitions for the AI verification pipeline.
 * Each stage produces a typed result that feeds into the decision engine.
 */

export interface OcrResult {
  rawText: string;
  confidence: number;          // 0–100 mean confidence
  wordConfidences: { word: string; confidence: number }[];
  passed: boolean;
  failureReason?: string;
}

export interface ExtractedFields {
  transactionId?: string;
  utr?: string;
  senderName?: string;
  receiverName?: string;
  date?: string;
  time?: string;
  amount?: number;             // In paise
  currency?: string;
  status?: string;             // e.g., "Success", "Completed"
}

export interface FinancialExtractionResult {
  fields: ExtractedFields;
  confidence: number;          // How many fields were successfully extracted
  passed: boolean;
  failureReason?: string;
}

export interface AmountReconciliationResult {
  declaredAmount: number;      // What the donor entered (paise)
  extractedAmount?: number;    // What OCR found (paise)
  matched: boolean;
  mismatchDelta?: number;      // Difference in paise
  passed: boolean;
  failureReason?: string;
}

export interface FraudSignal {
  type: string;
  description: string;
  weight: number;              // 0–1 contribution to risk score
  detected: boolean;
}

export interface FraudDetectionResult {
  riskScore: number;           // 0–100
  signals: FraudSignal[];
  flagged: boolean;
  passed: boolean;
  failureReason?: string;
}

export interface TransactionValidationResult {
  statusText?: string;
  isSuccessful: boolean;
  formatValid: boolean;
  passed: boolean;
  failureReason?: string;
}

export interface TimestampValidationResult {
  extractedTimestamp?: Date;
  serverTimestamp: Date;
  ageHours?: number;
  isFuture: boolean;
  isTooOld: boolean;
  passed: boolean;
  failureReason?: string;
}

export interface VerificationConfig {
  ocrConfidenceThreshold: number;
  fraudRiskThreshold: number;
  timestampMaxAgeHours: number;
  amountMismatchTolerancePaise: number;
  autoApproveEnabled: boolean;
  requireManualReviewAboveAmount: number;
}

export type VerificationDecision = 'verified' | 'rejected' | 'pending_admin_review';

export interface PipelineResult {
  decision: VerificationDecision;
  reasons: string[];
  ocr: OcrResult;
  extraction: FinancialExtractionResult;
  amountReconciliation: AmountReconciliationResult;
  fraudDetection: FraudDetectionResult;
  transactionValidation: TransactionValidationResult;
  timestampValidation: TimestampValidationResult;
  overallConfidence: number;
  processedAt: Date;
}
