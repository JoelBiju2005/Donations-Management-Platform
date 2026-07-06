import { z } from 'zod';

/**
 * Donation form validation schemas.
 * Used both server-side (here) and mirrored client-side (Zod is isomorphic).
 */

// Phone number validation — accepts Indian numbers with optional +91 prefix
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const createDonationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and periods'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  amount: z
    .number()
    .int('Amount must be a whole number (in paise)')
    .min(100, 'Minimum donation is ₹1'),
  currency: z.string().default('INR'),
  paymentMethod: z.enum(['upi', 'bank_transfer']),
  dedicationNote: z
    .string()
    .trim()
    .max(500, 'Dedication note must be at most 500 characters')
    .optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

export const initDonationSessionSchema = z.object({
  amount: z
    .number()
    .int()
    .min(100, 'Minimum donation is ₹1'),
  currency: z.string().default('INR'),
  paymentMethod: z.enum(['upi', 'bank_transfer']),
  dedicationNote: z.string().trim().max(500).optional(),
});

export type InitDonationSessionInput = z.infer<typeof initDonationSessionSchema>;

export const donationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.enum(['upi', 'bank_transfer']).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DonationQueryInput = z.infer<typeof donationQuerySchema>;

export const updateDonationStatusSchema = z.object({
  status: z.enum(['successful', 'rejected', 'marked_unsuccessful']),
  reason: z.string().min(1, 'Reason is required').max(500),
});
