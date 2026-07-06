"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const donation_controller_1 = require("./donation.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const validateRequest_1 = require("../../middleware/validateRequest");
const donation_validation_1 = require("./donation.validation");
const errors_1 = require("../../core/errors");
const storage_1 = require("../../services/storage");
const asyncHandler_1 = require("../../core/asyncHandler");
const sharp_1 = __importDefault(require("sharp"));
const router = (0, express_1.Router)();
exports.donationRoutes = router;
// ─── Multer Configuration ───────────────────────────────────
// Files stored temporarily in memory for validation before writing to storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024, // 8MB
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(file.mimetype)) {
            cb(new errors_1.FileUploadError('Only PNG and JPEG images are allowed'));
            return;
        }
        cb(null, true);
    },
});
/**
 * Middleware: validate uploaded file (MIME, magic bytes, size)
 * and save to storage provider.
 */
const processUpload = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const file = req.file;
    if (!file) {
        throw new errors_1.FileUploadError('Payment screenshot is required');
    }
    // Magic byte verification — don't trust MIME type alone
    const magicBytes = file.buffer.slice(0, 4);
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
        magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8;
    if (!isPng && !isJpeg) {
        throw new errors_1.FileUploadError('Invalid image file. Only genuine PNG and JPEG files are accepted.');
    }
    // Generate safe filename (never trust client filename)
    const ext = isPng ? '.png' : '.jpg';
    const safeFilename = `${(0, uuid_1.v4)()}${ext}`;
    // Compute perceptual hash for duplicate detection using sharp
    let screenshotHash = '';
    try {
        const hashBuffer = await (0, sharp_1.default)(file.buffer)
            .resize(8, 8, { fit: 'fill' })
            .greyscale()
            .raw()
            .toBuffer();
        // Simple average hash: compare each pixel to the mean
        const pixels = Array.from(hashBuffer);
        const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
        screenshotHash = pixels.map((p) => (p >= avg ? '1' : '0')).join('');
    }
    catch {
        // Non-critical — proceed without hash
    }
    // Save to storage provider
    const storage = (0, storage_1.getStorageProvider)();
    const screenshotUrl = await storage.save(file.buffer, safeFilename, 'payment-proofs', file.mimetype);
    req.screenshotUrl = screenshotUrl;
    req.screenshotHash = screenshotHash;
    next();
});
// ─── Public Routes ──────────────────────────────────────────
// POST /api/donations/session — initialize donation flow
router.post('/session', (0, validateRequest_1.validateRequest)(donation_validation_1.initDonationSessionSchema), donation_controller_1.initSession);
// POST /api/donations — submit donation + screenshot
router.post('/', (0, rateLimiter_1.createUploadRateLimiter)(), upload.single('screenshot'), processUpload, donation_controller_1.createDonation);
// GET /api/donations/:id/status — poll verification status (public)
router.get('/:id/status', donation_controller_1.getDonationStatus);
// GET /api/donations/:id — donation detail (public=receipt, admin=full)
router.get('/:id', auth_1.optionalAuthMiddleware, donation_controller_1.getDonation);
// ─── Admin Routes ───────────────────────────────────────────
// GET /api/donations — list all (admin only)
router.get('/', auth_1.authMiddleware, donation_controller_1.listDonations);
// PATCH /api/donations/:id/status — admin status update
router.patch('/:id/status', auth_1.authMiddleware, (0, validateRequest_1.validateRequest)(donation_validation_1.updateDonationStatusSchema), donation_controller_1.updateDonationStatus);
//# sourceMappingURL=donation.routes.js.map