"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDonationStatus = exports.listDonations = exports.getDonation = exports.getDonationStatus = exports.createDonation = exports.initSession = void 0;
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = require("../../core/asyncHandler");
const Donation_1 = require("../../models/Donation");
const Counter_1 = require("../../models/Counter");
const AuditLog_1 = require("../../models/AuditLog");
const errors_1 = require("../../core/errors");
const env_1 = require("../../config/env");
const verification_queue_1 = require("../../queues/verification.queue");
const redis_1 = require("../../config/redis");
const logger_1 = require("../../core/logger");
const receiptAutomation_1 = require("../../services/receipt/receiptAutomation");
/**
 * POST /api/donations/session
 * Initialize a donation session — creates a server-side record with a signed token.
 * Prevents client-side flow tampering.
 */
exports.initSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { amount, currency, paymentMethod, dedicationNote } = req.body;
    const config = (0, env_1.getConfig)();
    // Create signed session token
    const sessionToken = jsonwebtoken_1.default.sign({ amount, currency, paymentMethod, ts: Date.now() }, config.JWT_SECRET, { expiresIn: '1h' });
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
exports.createDonation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, phone, email, amount, currency, paymentMethod, dedicationNote, idempotencyKey } = req.body;
    const screenshotUrl = req.screenshotUrl;
    const screenshotHash = req.screenshotHash || '';
    // Idempotency check — prevent duplicate submissions
    if (idempotencyKey) {
        const existing = await Donation_1.Donation.findOne({ idempotencyKey });
        if (existing) {
            logger_1.logger.info({ idempotencyKey }, 'Duplicate submission detected, returning existing record');
            res.json({
                success: true,
                data: { donationId: existing._id, status: existing.status },
            });
            return;
        }
    }
    // Create donation record
    const donation = await Donation_1.Donation.create({
        donor: { name, phone, email },
        amount,
        currency: currency || 'INR',
        paymentMethod,
        dedicationNote,
        screenshotUrl,
        screenshotHash,
        status: 'pending_verification',
        idempotencyKey: idempotencyKey || (0, uuid_1.v4)(),
        verification: { result: 'pending', reasons: [] },
        ocr: { rawText: '', confidence: 0 },
        fraudAnalysis: { riskScore: 0, signals: [], flagged: false },
    });
    logger_1.logger.info({ donationId: donation._id, amount }, 'Donation created, queuing verification');
    // Enqueue AI verification job
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, verification_queue_1.enqueueVerificationJob)(donation._id.toString());
    }
    else {
        // In-process fallback for development without Redis
        (0, verification_queue_1.processVerificationInProcess)(donation._id.toString());
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
exports.getDonationStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const donation = await Donation_1.Donation.findById(id).select('status verification.result receipt.receiptNumber');
    if (!donation) {
        throw new errors_1.NotFoundError('Donation');
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
exports.getDonation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const isAdmin = !!req.admin;
    const donation = await Donation_1.Donation.findById(id);
    if (!donation) {
        throw new errors_1.NotFoundError('Donation');
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
exports.listDonations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, status, search, startDate, endDate, paymentMethod, sortBy, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    // Build query filter
    const filter = { isDeleted: false };
    if (status) {
        const statuses = status.split(',');
        filter.status = { $in: statuses };
    }
    if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    // Search across multiple fields
    if (search) {
        const searchStr = search;
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
            filter.$or.push({ amount: Math.round(amountSearch * 100) });
        }
    }
    // Sort
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const [donations, total] = await Promise.all([
        Donation_1.Donation.find(filter)
            .sort({ [sortField]: sortDir })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Donation_1.Donation.countDocuments(filter),
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
exports.updateDonationStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const admin = req.admin;
    const donation = await Donation_1.Donation.findById(id);
    if (!donation) {
        throw new errors_1.NotFoundError('Donation');
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
        const receiptNumber = await (0, Counter_1.getNextReceiptNumber)();
        donation.receipt = {
            receiptNumber,
            generatedAt: new Date(),
        };
    }
    await donation.save();
    // If manual status update is successful, automate PDF receipt generation and email delivery
    if (status === 'successful') {
        // Run asynchronously in the background so it doesn't block the HTTP response
        setImmediate(async () => {
            try {
                await (0, receiptAutomation_1.automateSuccessfulDonationReceipt)(donation);
            }
            catch (err) {
                logger_1.logger.error({ donationId: donation._id, error: err.message }, 'Failed to automate receipt generation on manual admin release');
            }
        });
    }
    // Audit log
    await (0, AuditLog_1.createAuditEntry)({
        actor: admin.id,
        actorEmail: admin.email,
        action: `donation.${status}`,
        targetType: 'Donation',
        targetId: id,
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
    logger_1.logger.info({ donationId: id, oldStatus, newStatus: status, admin: admin.email }, 'Donation status updated by admin');
    res.json({
        success: true,
        data: {
            id: donation._id,
            status: donation.status,
            receipt: donation.receipt,
        },
    });
});
//# sourceMappingURL=donation.controller.js.map