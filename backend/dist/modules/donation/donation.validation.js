"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDonationStatusSchema = exports.donationQuerySchema = exports.initDonationSessionSchema = exports.createDonationSchema = void 0;
const zod_1 = require("zod");
/**
 * Donation form validation schemas.
 * Used both server-side (here) and mirrored client-side (Zod is isomorphic).
 */
// Phone number validation — accepts Indian numbers with optional +91 prefix
const phoneRegex = /^\+?[1-9]\d{6,14}$/;
exports.createDonationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and periods'),
    phone: zod_1.z
        .string()
        .trim()
        .regex(phoneRegex, 'Please enter a valid phone number'),
    email: zod_1.z
        .string()
        .trim()
        .email('Please enter a valid email address')
        .toLowerCase(),
    amount: zod_1.z
        .number()
        .int('Amount must be a whole number (in paise)')
        .min(100, 'Minimum donation is ₹1'),
    currency: zod_1.z.string().default('INR'),
    paymentMethod: zod_1.z.enum(['upi', 'bank_transfer']),
    dedicationNote: zod_1.z
        .string()
        .trim()
        .max(500, 'Dedication note must be at most 500 characters')
        .optional(),
    idempotencyKey: zod_1.z.string().optional(),
});
exports.initDonationSessionSchema = zod_1.z.object({
    amount: zod_1.z
        .number()
        .int()
        .min(100, 'Minimum donation is ₹1'),
    currency: zod_1.z.string().default('INR'),
    paymentMethod: zod_1.z.enum(['upi', 'bank_transfer']),
    dedicationNote: zod_1.z.string().trim().max(500).optional(),
});
exports.donationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(['upi', 'bank_transfer']).optional(),
    sortBy: zod_1.z.string().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.updateDonationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['successful', 'rejected', 'marked_unsuccessful']),
    reason: zod_1.z.string().min(1, 'Reason is required').max(500),
});
//# sourceMappingURL=donation.validation.js.map