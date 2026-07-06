"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQrCode = exports.getPublicSettings = exports.updateSettings = exports.getSettings = void 0;
const asyncHandler_1 = require("../../core/asyncHandler");
const TempleSettings_1 = require("../../models/TempleSettings");
const AuditLog_1 = require("../../models/AuditLog");
const errors_1 = require("../../core/errors");
const storage_1 = require("../../services/storage");
const uuid_1 = require("uuid");
/**
 * GET /api/settings
 * Get temple settings. Public endpoint (used by homepage and donation flow).
 * Sensitive fields (bank account number) are masked for public access.
 */
exports.getSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    const isAdmin = !!req.admin;
    const data = settings.toObject();
    // Mask sensitive bank details for public access
    if (!isAdmin && data.bankDetails?.accountNumber) {
        const acc = data.bankDetails.accountNumber;
        data.bankDetails.accountNumber = '●●●●●●●●' + acc.slice(-4);
    }
    res.json({ success: true, data });
});
/**
 * PUT /api/settings
 * Update temple settings. Admin-only.
 * Every change is recorded in the audit log.
 */
exports.updateSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const admin = req.admin;
    const updates = req.body;
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    // Track what changed for audit
    const oldValues = {};
    for (const key of Object.keys(updates)) {
        oldValues[key] = settings[key];
    }
    // Apply updates
    Object.assign(settings, updates);
    await settings.save();
    // Audit log
    await (0, AuditLog_1.createAuditEntry)({
        actor: admin.id,
        actorEmail: admin.email,
        action: 'settings.updated',
        targetType: 'TempleSettings',
        targetId: settings._id.toString(),
        metadata: {
            updatedFields: Object.keys(updates),
            oldValues,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
    });
    res.json({ success: true, data: settings });
});
/**
 * GET /api/settings/public
 * Explicitly public endpoint — minimal settings for the donation flow.
 */
exports.getPublicSettings = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    res.json({
        success: true,
        data: {
            templeName: settings.templeName,
            aboutText: settings.aboutText,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            templeTimings: settings.templeTimings,
            upiId: settings.upiId,
            upiQrCodeUrl: settings.upiQrCodeUrl,
            bankDetails: {
                accountHolderName: settings.bankDetails.accountHolderName,
                bankName: settings.bankDetails.bankName,
                // Account number masked for public
                accountNumber: '●●●●●●●●' + settings.bankDetails.accountNumber.slice(-4),
                ifscCode: settings.bankDetails.ifscCode,
                branch: settings.bankDetails.branch,
            },
            donationPurposes: settings.donationPurposes.filter((p) => p.isActive),
            socialLinks: settings.socialLinks,
            logoUrl: settings.logoUrl,
            mapEmbedUrl: settings.mapEmbedUrl,
        },
    });
});
/**
 * POST /api/settings/upload-qr
 * Upload UPI QR code image. Admin-only.
 */
exports.uploadQrCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file) {
        throw new errors_1.FileUploadError('QR code image file is required');
    }
    // Magic byte verification
    const magicBytes = file.buffer.slice(0, 4);
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
        magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8;
    if (!isPng && !isJpeg) {
        throw new errors_1.FileUploadError('Invalid image file. Only genuine PNG and JPEG files are accepted.');
    }
    const ext = isPng ? '.png' : '.jpg';
    const safeFilename = `qr-${(0, uuid_1.v4)()}${ext}`;
    const storage = (0, storage_1.getStorageProvider)();
    const qrcodeUrl = await storage.save(file.buffer, safeFilename, 'qr-codes', file.mimetype);
    // Auto-save the settings with the new QR Code URL
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    settings.upiQrCodeUrl = qrcodeUrl;
    await settings.save();
    res.json({
        success: true,
        data: {
            upiQrCodeUrl: qrcodeUrl,
        },
    });
});
//# sourceMappingURL=settings.controller.js.map