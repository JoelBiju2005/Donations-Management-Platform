import { AmountReconciliationResult } from '../types';
/**
 * Stage 3 — Amount Reconciliation
 * Compares the extracted amount against what the donor declared.
 * Surfaces mismatches for admin review or auto-rejection based on tolerance.
 */
export declare function runAmountReconciliation(declaredAmount: number, // Paise
extractedAmount: number | undefined, tolerancePaise: number): AmountReconciliationResult;
//# sourceMappingURL=AmountReconciliation.d.ts.map