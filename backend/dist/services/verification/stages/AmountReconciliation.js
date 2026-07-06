"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAmountReconciliation = runAmountReconciliation;
const logger_1 = require("../../../core/logger");
/**
 * Stage 3 — Amount Reconciliation
 * Compares the extracted amount against what the donor declared.
 * Surfaces mismatches for admin review or auto-rejection based on tolerance.
 */
function runAmountReconciliation(declaredAmount, // Paise
extractedAmount, tolerancePaise) {
    // If no amount was extracted, flag but don't hard-reject
    if (extractedAmount === undefined || extractedAmount === 0) {
        logger_1.logger.debug({ declaredAmount }, 'Amount not extracted from OCR — flagging for review');
        return {
            declaredAmount,
            extractedAmount: undefined,
            matched: false,
            passed: false, // Will result in admin review, not rejection
            failureReason: 'Could not extract the payment amount from the screenshot for verification.',
        };
    }
    const delta = Math.abs(declaredAmount - extractedAmount);
    const matched = delta <= tolerancePaise;
    logger_1.logger.debug({ declaredAmount, extractedAmount, delta, tolerancePaise, matched }, 'Amount reconciliation');
    return {
        declaredAmount,
        extractedAmount,
        matched,
        mismatchDelta: delta,
        passed: matched,
        failureReason: !matched
            ? `The amount in the screenshot (₹${(extractedAmount / 100).toFixed(2)}) doesn't match the declared donation amount (₹${(declaredAmount / 100).toFixed(2)}).`
            : undefined,
    };
}
//# sourceMappingURL=AmountReconciliation.js.map