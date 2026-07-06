import { Router } from 'express';
import multer from 'multer';
import { getSettings, updateSettings, getPublicSettings, uploadQrCode } from './settings.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { FileUploadError } from '../../core/errors';

const router = Router();

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

// GET /api/settings/public — no auth required
router.get('/public', getPublicSettings);

// GET /api/settings — optionally authenticated (public gets masked bank details)
router.get('/', optionalAuthMiddleware, getSettings);

// PUT /api/settings — admin only
router.put('/', authMiddleware, updateSettings);

// POST /api/settings/upload-qr — admin only, handles QR file uploads
router.post('/upload-qr', authMiddleware, upload.single('qrCode'), uploadQrCode);

export { router as settingsRoutes };
