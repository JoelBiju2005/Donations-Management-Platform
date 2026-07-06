import { PipelineResult } from './types';
/**
 * Verification Pipeline Orchestrator
 * Uses Google Gemini 2.5 Flash Vision for primary verification.
 * Falls back to Tesseract OCR + Heuristics when Gemini is unavailable or fails.
 */
export declare function runVerificationPipeline(donationId: string): Promise<PipelineResult>;
//# sourceMappingURL=VerificationPipeline.d.ts.map