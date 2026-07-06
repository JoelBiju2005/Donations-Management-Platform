import { Request, Response } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { TempleSettings, getTempleSettings } from '../../models/TempleSettings';
import { createAuditEntry } from '../../models/AuditLog';
import { NotFoundError, FileUploadError } from '../../core/errors';
import { getStorageProvider } from '../../services/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/settings
 * Get temple settings. Public endpoint (used by homepage and donation flow).
 * Sensitive fields (bank account number) are masked for public access.
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getTempleSettings();
  const isAdmin = !!(req as any).admin;

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
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const updates = req.body;

  const settings = await getTempleSettings();

  // Track what changed for audit
  const oldValues: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    oldValues[key] = (settings as any)[key];
  }

  // Apply updates
  Object.assign(settings, updates);
  await settings.save();

  // Audit log
  await createAuditEntry({
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
export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getTempleSettings();

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
export const uploadQrCode = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new FileUploadError('QR code image file is required');
  }

  // Magic byte verification
  const magicBytes = file.buffer.slice(0, 4);
  const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
    magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
  const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8;

  if (!isPng && !isJpeg) {
    throw new FileUploadError('Invalid image file. Only genuine PNG and JPEG files are accepted.');
  }

  const ext = isPng ? '.png' : '.jpg';
  const safeFilename = `qr-${uuidv4()}${ext}`;

  const storage = getStorageProvider();
  const qrcodeUrl = await storage.save(
    file.buffer,
    safeFilename,
    'qr-codes',
    file.mimetype
  );

  // Auto-save the settings with the new QR Code URL
  const settings = await getTempleSettings();
  settings.upiQrCodeUrl = qrcodeUrl;
  await settings.save();

  res.json({
    success: true,
    data: {
      upiQrCodeUrl: qrcodeUrl,
    },
  });
});
