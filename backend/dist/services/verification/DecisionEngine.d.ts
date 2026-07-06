import { PipelineResult, VerificationConfig, VerificationDecision } from './types';
/**
 * Decision Engine — combines all 6 stage results into a single verification decision.
 *
 * Logic:
 * - Hard rejection: fraud detected (duplicate, editing software), payment failed, future timestamp
 * - Auto-approve: all checks pass and auto-approve is enabled
 * - Admin review: borderline confidence, amount mismatch, or missing data
 */
export declare function makeVerificationDecision(pipeline: Omit<PipelineResult, 'decision' | 'reasons' | 'overallConfidence' | 'processedAt'>, config: VerificationConfig): {
    decision: VerificationDecision;
    reasons: string[];
    overallConfidence: number;
};
//# sourceMappingURL=DecisionEngine.d.ts.map