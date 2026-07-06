import { TransactionValidationResult, ExtractedFields } from '../types';
import { logger } from '../../../core/logger';

/**
 * Stage 5 — Transaction Validation
 * Confirms extracted status indicates success, and validates format sanity.
 */

const successTerms = ['success', 'successful', 'completed', 'complete', 'paid', 'received', 'approved', 'done'];
const failureTerms = ['failed', 'failure', 'declined', 'rejected', 'cancelled', 'canceled', 'pending', 'processing'];

// Known transaction ID format patterns
const knownIdFormats: Record<string, RegExp> = {
  upi: /^[A-Za-z0-9]{12,35}$/,     // UPI reference numbers
  gpay: /^T\d{10,}$/,               // Google Pay transaction IDs
  phonepe: /^[A-Z0-9]{10,}$/,       // PhonePe
  paytm: /^\d{10,20}$/,             // Paytm
  generic: /^[A-Za-z0-9\-_]{6,40}$/, // Generic alphanumeric
};

export function runTransactionValidation(fields: ExtractedFields): TransactionValidationResult {
  try {
    // Check payment status text
    const statusText = (fields.status || '').toLowerCase().trim();
    let isSuccessful = false;

    if (statusText) {
      isSuccessful = successTerms.some((term) => statusText.includes(term));
      const isFailed = failureTerms.some((term) => statusText.includes(term));

      if (isFailed) {
        return {
          statusText: fields.status,
          isSuccessful: false,
          formatValid: true,
          passed: false,
          failureReason: `The payment appears to have ${statusText}. Only successful payments can be verified.`,
        };
      }
    } else {
      // No status text found — can't confirm or deny
      isSuccessful = false;
    }

    // Format sanity checks
    let formatValid = true;

    // Amount should be numeric and positive
    if (fields.amount !== undefined && (fields.amount <= 0 || isNaN(fields.amount))) {
      formatValid = false;
    }

    // Transaction ID format check
    if (fields.transactionId) {
      const matchesKnownFormat = Object.values(knownIdFormats).some((pattern) =>
        pattern.test(fields.transactionId!)
      );
      if (!matchesKnownFormat) {
        logger.debug(
          { transactionId: fields.transactionId },
          'Transaction ID does not match any known format'
        );
        // Don't fail — just note it. Unknown format doesn't mean invalid.
      }
    }

    // Date sanity: if a date was extracted, check it's a valid calendar date
    if (fields.date) {
      const parsedDate = new Date(fields.date);
      if (isNaN(parsedDate.getTime())) {
        // Try DD/MM/YYYY format
        const parts = fields.date.split(/[/\-\.]/);
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number);
          if (day < 1 || day > 31 || month < 1 || month > 12) {
            formatValid = false;
          }
        }
      }
    }

    const passed = statusText ? isSuccessful && formatValid : formatValid;

    logger.debug(
      { statusText, isSuccessful, formatValid, passed },
      'Transaction validation complete'
    );

    return {
      statusText: fields.status,
      isSuccessful,
      formatValid,
      passed,
      failureReason: !passed
        ? statusText
          ? 'The payment status could not be confirmed as successful.'
          : 'Could not verify the payment status from the screenshot.'
        : undefined,
    };
  } catch (error: any) {
    logger.error({ error }, 'Transaction validation failed');
    return {
      isSuccessful: false,
      formatValid: false,
      passed: false,
      failureReason: 'Transaction details could not be validated.',
    };
  }
}
