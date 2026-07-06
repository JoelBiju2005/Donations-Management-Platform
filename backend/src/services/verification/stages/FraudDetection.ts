import sharp from 'sharp';
import exifr from 'exifr';
import { FraudDetectionResult, FraudSignal } from '../types';
import { Donation } from '../../../models/Donation';
import { logger } from '../../../core/logger';

/**
 * Stage 4 — Fraud/Tamper Detection
 * Runs independently of OCR success. Multiple checks contribute
 * weighted sub-scores to an overall fraudRiskScore (0–100).
 *
 * Checks:
 * 1. EXIF/metadata inspection
 * 2. Error Level Analysis (ELA) for compression tampering
 * 3. Perceptual hash duplicate detection
 * 4. Metadata consistency checks
 */

async function checkExifMetadata(imageBuffer: Buffer): Promise<FraudSignal> {
  try {
    const exif = await exifr.parse(imageBuffer, { pick: ['Software', 'CreatorTool', 'ModifyDate', 'CreateDate'] });

    if (!exif) {
      // No EXIF — stripped metadata can be suspicious but is common for screenshots
      return {
        type: 'exif_stripped',
        description: 'Image metadata has been stripped (common for screenshots but also for edited images)',
        weight: 0.1,
        detected: true,
      };
    }

    // Check for editing software signatures
    const editingSoftware = ['photoshop', 'gimp', 'paint', 'canva', 'pixlr', 'snapseed'];
    const software = (exif.Software || exif.CreatorTool || '').toLowerCase();
    const hasEditingSoftware = editingSoftware.some((s) => software.includes(s));

    if (hasEditingSoftware) {
      return {
        type: 'editing_software',
        description: `Image was processed with editing software: ${exif.Software || exif.CreatorTool}`,
        weight: 0.6,
        detected: true,
      };
    }

    // Check date consistency
    if (exif.ModifyDate && exif.CreateDate) {
      const created = new Date(exif.CreateDate).getTime();
      const modified = new Date(exif.ModifyDate).getTime();
      if (modified - created > 60000) { // Modified > 1 minute after creation
        return {
          type: 'date_mismatch',
          description: 'Image modification date is significantly after creation date',
          weight: 0.3,
          detected: true,
        };
      }
    }

    return {
      type: 'exif_clean',
      description: 'EXIF metadata appears normal',
      weight: 0,
      detected: false,
    };
  } catch {
    return {
      type: 'exif_parse_error',
      description: 'Could not parse image metadata',
      weight: 0.05,
      detected: false,
    };
  }
}

async function checkErrorLevelAnalysis(imageBuffer: Buffer): Promise<FraudSignal> {
  try {
    // Simplified ELA: re-compress at low quality, compare with original
    // High variance in the difference image suggests manipulation
    const original = await sharp(imageBuffer).greyscale().raw().toBuffer({ resolveWithObject: true });

    const recompressed = await sharp(imageBuffer)
      .jpeg({ quality: 20 })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Ensure same dimensions for comparison
    if (original.info.width !== recompressed.info.width ||
        original.info.height !== recompressed.info.height) {
      return { type: 'ela_skip', description: 'Dimension mismatch', weight: 0, detected: false };
    }

    // Calculate pixel-level differences
    const len = Math.min(original.data.length, recompressed.data.length);
    let totalDiff = 0;
    let maxDiff = 0;
    const regionDiffs: number[] = [];
    const regionSize = Math.floor(len / 16);

    for (let i = 0; i < len; i++) {
      const diff = Math.abs(original.data[i] - recompressed.data[i]);
      totalDiff += diff;
      maxDiff = Math.max(maxDiff, diff);

      // Track regional variance
      const regionIdx = Math.floor(i / regionSize);
      if (!regionDiffs[regionIdx]) regionDiffs[regionIdx] = 0;
      regionDiffs[regionIdx] += diff;
    }

    const avgDiff = totalDiff / len;

    // High regional variance indicates selective editing
    const regionAvg = regionDiffs.reduce((a, b) => a + b, 0) / regionDiffs.length;
    const regionVariance = regionDiffs.reduce((sum, d) => sum + Math.pow(d - regionAvg, 2), 0) / regionDiffs.length;
    const normalizedVariance = Math.sqrt(regionVariance) / (regionAvg || 1);

    const isSuspicious = normalizedVariance > 2.5; // Threshold for suspicious variance

    return {
      type: 'ela_analysis',
      description: isSuspicious
        ? 'Error Level Analysis detected inconsistent compression patterns suggesting possible image manipulation'
        : 'Error Level Analysis shows consistent compression patterns',
      weight: isSuspicious ? 0.5 : 0,
      detected: isSuspicious,
    };
  } catch (error) {
    logger.debug({ error }, 'ELA check failed');
    return { type: 'ela_error', description: 'ELA analysis could not be performed', weight: 0, detected: false };
  }
}

async function checkDuplicateHash(screenshotHash: string, currentDonationId: string): Promise<FraudSignal> {
  if (!screenshotHash) {
    return { type: 'hash_skip', description: 'No hash available', weight: 0, detected: false };
  }

  try {
    // Find any previous donation with the same or very similar hash
    const duplicate = await Donation.findOne({
      _id: { $ne: currentDonationId },
      screenshotHash,
      isDeleted: false,
    }).select('_id donor.name createdAt');

    if (duplicate) {
      return {
        type: 'duplicate_screenshot',
        description: `This screenshot appears identical to one previously submitted (Donation ${duplicate._id})`,
        weight: 0.9, // Very high — strong fraud indicator
        detected: true,
      };
    }

    return {
      type: 'hash_unique',
      description: 'Screenshot has not been previously submitted',
      weight: 0,
      detected: false,
    };
  } catch {
    return { type: 'hash_error', description: 'Duplicate check failed', weight: 0, detected: false };
  }
}

/**
 * Run all fraud detection checks and compute weighted risk score.
 */
export async function runFraudDetection(
  imageBuffer: Buffer,
  screenshotHash: string,
  donationId: string,
  fraudThreshold: number
): Promise<FraudDetectionResult> {
  // Run all checks in parallel
  const [exifResult, elaResult, hashResult] = await Promise.all([
    checkExifMetadata(imageBuffer),
    checkErrorLevelAnalysis(imageBuffer),
    checkDuplicateHash(screenshotHash, donationId),
  ]);

  const signals = [exifResult, elaResult, hashResult];
  const detectedSignals = signals.filter((s) => s.detected);

  // Weighted risk score (0–100)
  const totalWeight = detectedSignals.reduce((sum, s) => sum + s.weight, 0);
  const riskScore = Math.min(100, Math.round(totalWeight * 100));

  const flagged = riskScore >= fraudThreshold;

  logger.debug(
    { riskScore, fraudThreshold, flagged, detectedCount: detectedSignals.length },
    'Fraud detection complete'
  );

  return {
    riskScore,
    signals,
    flagged,
    passed: !flagged,
    failureReason: flagged
      ? 'The payment screenshot did not pass our verification checks. Please submit a clear, unedited screenshot of the original payment confirmation.'
      : undefined,
  };
}
