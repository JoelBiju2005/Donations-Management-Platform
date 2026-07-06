import { PipelineResult } from './types';
/**
 * Verification Pipeline Orchestrator
 * Runs all 6 stages sequentially (OCR must complete before extraction)
 * and fraud detection in parallel, then feeds results to the decision engine.
 */
export declare function runVerificationPipeline(donationId: string): Promise<PipelineResult>;
//# sourceMappingURL=VerificationPipeline.d.ts.map