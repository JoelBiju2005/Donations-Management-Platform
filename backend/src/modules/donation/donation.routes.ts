import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
  initSession,
  createDonation,
  getDonationStatus,
  getDonation,
  listDonations,
  updateDonationStatus,
} from './donation.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { createUploadRateLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';
import { initDonationSessionSchema, updateDonationStatusSchema } from './donation.validation';
import { FileUploadError } from '../../core/errors';
import { getStorageProvider } from '../../services/storage';
import { asyncHandler } from '../../core/asyncHandler';
import sharp from 'sharp';

const router = Router();

// ─── Multer Configuration ───────────────────────────────────
// Files stored temporarily in memory for validation before writing to storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      cb(new FileUploadError('Only PNG and JPEG images are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Middleware: validate uploaded file (MIME, magic bytes, size)
 * and save to storage provider.
 */
const processUpload = asyncHandler(async (req, _res, next) => {
  const file = req.file;
  if (!file) {
    throw new FileUploadError('Payment screenshot is required');
  }

  // Magic byte verification — don't trust MIME type alone
  const magicBytes = file.buffer.slice(0, 4);
  const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
    magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
  const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8;

  if (!isPng && !isJpeg) {
    throw new FileUploadError('Invalid image file. Only genuine PNG and JPEG files are accepted.');
  }

  // Generate safe filename (never trust client filename)
  const ext = isPng ? '.png' : '.jpg';
  const safeFilename = `${uuidv4()}${ext}`;

  // Compute perceptual hash for duplicate detection using sharp
  let screenshotHash = '';
  try {
    const hashBuffer = await sharp(file.buffer)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    // Simple average hash: compare each pixel to the mean
    const pixels = Array.from(hashBuffer);
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    screenshotHash = pixels.map((p) => (p >= avg ? '1' : '0')).join('');
  } catch {
    // Non-critical — proceed without hash
  }

  // Save to storage provider
  const storage = getStorageProvider();
  const screenshotUrl = await storage.save(
    file.buffer,
    safeFilename,
    'payment-proofs',
    file.mimetype
  );

  (req as any).screenshotUrl = screenshotUrl;
  (req as any).screenshotHash = screenshotHash;

  next();
});

// ─── Public Routes ──────────────────────────────────────────

// POST /api/donations/session — initialize donation flow
router.post('/session', validateRequest(initDonationSessionSchema), initSession);

// POST /api/donations — submit donation + screenshot
router.post(
  '/',
  createUploadRateLimiter(),
  upload.single('screenshot'),
  processUpload,
  createDonation
);

// GET /api/donations/:id/status — poll verification status (public)
router.get('/:id/status', getDonationStatus);

// GET /api/donations/:id — donation detail (public=receipt, admin=full)
router.get('/:id', optionalAuthMiddleware, getDonation);

// ─── Admin Routes ───────────────────────────────────────────

// GET /api/donations — list all (admin only)
router.get('/', authMiddleware, listDonations);

// PATCH /api/donations/:id/status — admin status update
router.patch(
  '/:id/status',
  authMiddleware,
  validateRequest(updateDonationStatusSchema),
  updateDonationStatus
);

export { router as donationRoutes };
