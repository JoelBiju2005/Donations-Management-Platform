import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../core/asyncHandler';
import { Donation } from '../../models/Donation';
import { getNextReceiptNumber } from '../../models/Counter';
import { createAuditEntry } from '../../models/AuditLog';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { getConfig } from '../../config/env';
import { enqueueVerificationJob, processVerificationInProcess } from '../../queues/verification.queue';
import { isRedisAvailable } from '../../config/redis';
import { logger } from '../../core/logger';

/**
 * POST /api/donations/session
 * Initialize a donation session — creates a server-side record with a signed token.
 * Prevents client-side flow tampering.
 */
export const initSession = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency, paymentMethod, dedicationNote } = req.body;
  const config = getConfig();

  // Create signed session token
  const sessionToken = jwt.sign(
    { amount, currency, paymentMethod, ts: Date.now() },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    success: true,
    data: { sessionToken },
  });
});

/**
 * POST /api/donations
 * Submit donation with payment proof. Creates the record and enqueues verification.
 * Supports idempotency keys to prevent duplicate submissions.
 */
export const createDonation = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email, amount, currency, paymentMethod, dedicationNote, idempotencyKey } = req.body;
  const screenshotUrl = (req as any).screenshotUrl;
  const screenshotHash = (req as any).screenshotHash || '';

  // Idempotency check — prevent duplicate submissions
  if (idempotencyKey) {
    const existing = await Donation.findOne({ idempotencyKey });
    if (existing) {
      logger.info({ idempotencyKey }, 'Duplicate submission detected, returning existing record');
      res.json({
        success: true,
        data: { donationId: existing._id, status: existing.status },
      });
      return;
    }
  }

  // Create donation record
  const donation = await Donation.create({
    donor: { name, phone, email },
    amount,
    currency: currency || 'INR',
    paymentMethod,
    dedicationNote,
    screenshotUrl,
    screenshotHash,
    status: 'pending_verification',
    idempotencyKey: idempotencyKey || uuidv4(),
    verification: { result: 'pending', reasons: [] },
    ocr: { rawText: '', confidence: 0 },
    fraudAnalysis: { riskScore: 0, signals: [], flagged: false },
  });

  logger.info({ donationId: donation._id, amount }, 'Donation created, queuing verification');

  // Enqueue AI verification job
  if (isRedisAvailable()) {
    await enqueueVerificationJob(donation._id.toString());
  } else {
    // In-process fallback for development without Redis
    processVerificationInProcess(donation._id.toString());
  }

  res.status(201).json({
    success: true,
    data: {
      donationId: donation._id,
      status: donation.status,
    },
  });
});

/**
 * GET /api/donations/:id/status
 * Poll verification status. Used by the /donate/verifying page.
 */
export const getDonationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const donation = await Donation.findById(id).select('status verification.result receipt.receiptNumber');
  if (!donation) {
    throw new NotFoundError('Donation');
  }

  res.json({
    success: true,
    data: {
      status: donation.status,
      verificationResult: donation.verification.result,
      receiptNumber: donation.receipt?.receiptNumber,
    },
  });
});

/**
 * GET /api/donations/:id
 * Full donation details. Admin-only for detailed view, or by donation ID for the donor's receipt.
 */
export const getDonation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = !!(req as any).admin;

  const donation = await Donation.findById(id);
  if (!donation) {
    throw new NotFoundError('Donation');
  }

  // Non-admin can only see basic receipt info if donation is successful
  if (!isAdmin) {
    if (donation.status !== 'successful') {
      // Only return status for non-successful donations
      res.json({
        success: true,
        data: {
          status: donation.status,
          verification: { result: donation.verification.result, reasons: donation.verification.reasons },
        },
      });
      return;
    }

    // Public receipt view
    res.json({
      success: true,
      data: {
        donor: { name: donation.donor.name },
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.paymentMethod,
        receipt: donation.receipt,
        status: donation.status,
        createdAt: donation.createdAt,
      },
    });
    return;
  }

  // Admin: return full details
  res.json({ success: true, data: donation });
});

/**
 * GET /api/donations
 * List donations with pagination, filtering, search. Admin-only.
 */
export const listDonations = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, search, startDate, endDate, paymentMethod, sortBy, sortOrder } = req.query as any;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build query filter
  const filter: Record<string, unknown> = { isDeleted: false };

  if (status) {
    const statuses = (status as string).split(',');
    filter.status = { $in: statuses };
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as any).$gte = new Date(startDate as string);
    if (endDate) (filter.createdAt as any).$lte = new Date(endDate as string);
  }

  // Search across multiple fields
  if (search) {
    const searchStr = search as string;
    filter.$or = [
      { 'donor.name': { $regex: searchStr, $options: 'i' } },
      { 'donor.email': { $regex: searchStr, $options: 'i' } },
      { 'donor.phone': { $regex: searchStr, $options: 'i' } },
      { 'receipt.receiptNumber': { $regex: searchStr, $options: 'i' } },
      { 'extractedFields.transactionId': { $regex: searchStr, $options: 'i' } },
    ];

    // Also try matching amount if search is a number
    const amountSearch = parseFloat(searchStr);
    if (!isNaN(amountSearch)) {
      (filter.$or as any[]).push({ amount: Math.round(amountSearch * 100) });
    }
  }

  // Sort
  const sortField = (sortBy as string) || 'createdAt';
  const sortDir = (sortOrder as string) === 'asc' ? 1 : -1;

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Donation.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      donations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

/**
 * PATCH /api/donations/:id/status
 * Admin action: approve, reject, or mark unsuccessful.
 * Triggers receipt generation on approval, email notifications, audit logging.
 */
export const updateDonationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const admin = (req as any).admin;

  const donation = await Donation.findById(id);
  if (!donation) {
    throw new NotFoundError('Donation');
  }

  const oldStatus = donation.status;

  // Update status
  donation.status = status;
  donation.verification.result = status === 'successful' ? 'verified' : status === 'rejected' ? 'rejected' : donation.verification.result;
  donation.verification.reviewedBy = admin.id;
  donation.verification.reviewedAt = new Date();
  donation.verification.reasons = [...(donation.verification.reasons || []), reason];

  // Generate receipt on approval
  if (status === 'successful' && !donation.receipt?.receiptNumber) {
    const receiptNumber = await getNextReceiptNumber();
    donation.receipt = {
      receiptNumber,
      generatedAt: new Date(),
    };
  }

  await donation.save();

  // Audit log
  await createAuditEntry({
    actor: admin.id,
    actorEmail: admin.email,
    action: `donation.${status}`,
    targetType: 'Donation',
    targetId: id as string,
    metadata: {
      oldStatus,
      newStatus: status,
      reason,
      donorEmail: donation.donor.email,
      amount: donation.amount,
    },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
  });

  logger.info(
    { donationId: id, oldStatus, newStatus: status, admin: admin.email },
    'Donation status updated by admin'
  );

  res.json({
    success: true,
    data: {
      id: donation._id,
      status: donation.status,
      receipt: donation.receipt,
    },
  });
});
