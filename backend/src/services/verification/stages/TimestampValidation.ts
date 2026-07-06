import { TimestampValidationResult, ExtractedFields } from '../types';
import { logger } from '../../../core/logger';

/**
 * Stage 6 — Timestamp Validation
 * Rejects future timestamps and screenshots older than the configurable window.
 */

function parseExtractedDate(dateStr?: string, timeStr?: string): Date | undefined {
  if (!dateStr) return undefined;

  let date: Date | undefined;

  // Try ISO format first
  date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    if (timeStr) {
      const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const seconds = parseInt(timeParts[3] || '0');
        const ampm = timeParts[4];

        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }

        date.setHours(hours, minutes, seconds);
      }
    }
    return date;
  }

  // Try DD/MM/YYYY format
  const dmy = dateStr.match(/(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})/);
  if (dmy) {
    const day = parseInt(dmy[1]);
    const month = parseInt(dmy[2]) - 1; // JS months are 0-indexed
    let year = parseInt(dmy[3]);
    if (year < 100) year += 2000;

    date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD Mon YYYY format
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const dMonY = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{2,4})/);
  if (dMonY) {
    const day = parseInt(dMonY[1]);
    const month = months[dMonY[2].toLowerCase()];
    let year = parseInt(dMonY[3]);
    if (year < 100) year += 2000;

    if (month !== undefined) {
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return undefined;
}

export function runTimestampValidation(
  fields: ExtractedFields,
  maxAgeHours: number
): TimestampValidationResult {
  const serverTimestamp = new Date();
  const extractedTimestamp = parseExtractedDate(fields.date, fields.time);

  // If no timestamp could be extracted, flag for review but don't hard-reject
  if (!extractedTimestamp) {
    logger.debug('No timestamp extracted — flagging for review');
    return {
      serverTimestamp,
      isFuture: false,
      isTooOld: false,
      passed: false, // Soft fail — will result in admin review
      failureReason: 'Could not determine the payment timestamp from the screenshot.',
    };
  }

  const ageMs = serverTimestamp.getTime() - extractedTimestamp.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  const isFuture = ageMs < -60000; // Allow 1 minute clock skew
  const isTooOld = ageHours > maxAgeHours;

  let passed = !isFuture && !isTooOld;
  let failureReason: string | undefined;

  if (isFuture) {
    passed = false;
    failureReason = 'The payment timestamp appears to be in the future, which indicates the screenshot may not be genuine.';
  } else if (isTooOld) {
    passed = false;
    failureReason = `The payment was made more than ${maxAgeHours} hours ago. Please submit recent payment screenshots.`;
  }

  logger.debug(
    { extractedTimestamp, ageHours, isFuture, isTooOld, passed },
    'Timestamp validation complete'
  );

  return {
    extractedTimestamp,
    serverTimestamp,
    ageHours: Math.round(ageHours * 10) / 10,
    isFuture,
    isTooOld,
    passed,
    failureReason,
  };
}
