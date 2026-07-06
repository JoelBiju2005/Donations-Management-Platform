"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFinancialExtraction = runFinancialExtraction;
const logger_1 = require("../../../core/logger");
/**
 * Stage 2 — Financial Field Extraction
 * Extracts structured financial data from raw OCR text using
 * pattern matching for common UPI apps (GPay, PhonePe, Paytm, BHIM)
 * plus generalized fallback patterns.
 *
 * Returns structured JSON with all extracted fields.
 */
// ─── Pattern Library ─────────────────────────────────────────
/** Amount patterns: ₹1,234.56 or Rs. 1234 or INR 1,234.00 */
const amountPatterns = [
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:amount|paid|received|total)[:\s]*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:paid|sent|received)/gi,
];
/** Transaction/Reference ID patterns */
const transactionIdPatterns = [
    /(?:transaction\s*(?:id|no|number|#)|txn\s*(?:id|no|#)|ref(?:erence)?\s*(?:id|no|number|#))[:\s]*([A-Za-z0-9]+)/gi,
    /(?:UPI\s*(?:ref|reference|transaction)\s*(?:id|no|number)?)[:\s]*([A-Za-z0-9]+)/gi,
    /(?:UTR|RRN|UPI\s*Ref)[:\s]*([A-Za-z0-9]+)/gi,
];
/** UTR/Reference number patterns */
const utrPatterns = [
    /(?:UTR)[:\s]*([A-Za-z0-9]+)/gi,
    /(?:RRN)[:\s]*(\d+)/gi,
    /(?:UPI\s*Ref(?:erence)?)[:\s]*(\d+)/gi,
];
/** Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY, YYYY-MM-DD */
const datePatterns = [
    /(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})/g,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi,
    /(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})/g,
];
/** Time patterns: HH:MM:SS or HH:MM AM/PM */
const timePatterns = [
    /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/gi,
];
/** Status patterns */
const statusPatterns = [
    /(?:status|payment)[:\s]*(success(?:ful)?|completed?|paid|received|failed|pending|declined)/gi,
    /(success(?:ful)?|completed?|paid|received|failed|pending|declined)/gi,
];
/** Name patterns (sender/receiver) */
const senderPatterns = [
    /(?:from|paid\s*by|sender|debited\s*from)[:\s]*([A-Za-z\s.]+?)(?:\n|$|,|\|)/gi,
    /(?:sent\s*by)[:\s]*([A-Za-z\s.]+?)(?:\n|$|,|\|)/gi,
];
const receiverPatterns = [
    /(?:to|paid\s*to|receiver|credited\s*to|beneficiary)[:\s]*([A-Za-z\s.]+?)(?:\n|$|,|\|)/gi,
];
// ─── Extraction Logic ────────────────────────────────────────
function extractFirst(text, patterns) {
    for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return undefined;
}
function parseAmount(amountStr) {
    // Remove commas and parse
    const cleaned = amountStr.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num <= 0)
        return undefined;
    // Convert to paise
    return Math.round(num * 100);
}
function runFinancialExtraction(ocrText) {
    try {
        const fields = {};
        let fieldsExtracted = 0;
        // Extract amount
        const amountStr = extractFirst(ocrText, amountPatterns);
        if (amountStr) {
            fields.amount = parseAmount(amountStr);
            if (fields.amount)
                fieldsExtracted++;
        }
        // Extract transaction ID
        fields.transactionId = extractFirst(ocrText, transactionIdPatterns);
        if (fields.transactionId)
            fieldsExtracted++;
        // Extract UTR
        fields.utr = extractFirst(ocrText, utrPatterns);
        if (fields.utr)
            fieldsExtracted++;
        // Extract date
        fields.date = extractFirst(ocrText, datePatterns);
        if (fields.date)
            fieldsExtracted++;
        // Extract time
        fields.time = extractFirst(ocrText, timePatterns);
        if (fields.time)
            fieldsExtracted++;
        // Extract status
        fields.status = extractFirst(ocrText, statusPatterns);
        if (fields.status)
            fieldsExtracted++;
        // Extract sender/receiver
        fields.senderName = extractFirst(ocrText, senderPatterns);
        if (fields.senderName)
            fieldsExtracted++;
        fields.receiverName = extractFirst(ocrText, receiverPatterns);
        if (fields.receiverName)
            fieldsExtracted++;
        fields.currency = 'INR';
        // Confidence: how many of the 8 key fields were extracted
        const confidence = Math.round((fieldsExtracted / 8) * 100);
        const passed = fieldsExtracted >= 2; // Need at least amount + one other field
        logger_1.logger.debug({ fieldsExtracted, confidence, fields }, 'Financial extraction complete');
        return {
            fields,
            confidence,
            passed,
            failureReason: !passed
                ? 'Could not extract sufficient transaction details from the screenshot. Please ensure the full payment confirmation is visible.'
                : undefined,
        };
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Financial extraction failed');
        return {
            fields: {},
            confidence: 0,
            passed: false,
            failureReason: 'Failed to extract transaction details from the screenshot.',
        };
    }
}
//# sourceMappingURL=FinancialExtraction.js.map