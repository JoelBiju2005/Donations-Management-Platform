"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const settings_controller_1 = require("./settings.controller");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../core/errors");
const router = (0, express_1.Router)();
exports.settingsRoutes = router;
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
// GET /api/settings/public — no auth required
router.get('/public', settings_controller_1.getPublicSettings);
// GET /api/settings — optionally authenticated (public gets masked bank details)
router.get('/', auth_1.optionalAuthMiddleware, settings_controller_1.getSettings);
// PUT /api/settings — admin only
router.put('/', auth_1.authMiddleware, settings_controller_1.updateSettings);
// POST /api/settings/upload-qr — admin only, handles QR file uploads
router.post('/upload-qr', auth_1.authMiddleware, upload.single('qrCode'), settings_controller_1.uploadQrCode);
//# sourceMappingURL=settings.routes.js.map