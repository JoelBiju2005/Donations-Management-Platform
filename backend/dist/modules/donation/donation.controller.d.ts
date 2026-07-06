/**
 * POST /api/donations/session
 * Initialize a donation session — creates a server-side record with a signed token.
 * Prevents client-side flow tampering.
 */
export declare const initSession: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * POST /api/donations
 * Submit donation with payment proof. Creates the record and enqueues verification.
 * Supports idempotency keys to prevent duplicate submissions.
 */
export declare const createDonation: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/donations/:id/status
 * Poll verification status. Used by the /donate/verifying page.
 */
export declare const getDonationStatus: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/donations/:id
 * Full donation details. Admin-only for detailed view, or by donation ID for the donor's receipt.
 */
export declare const getDonation: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/donations
 * List donations with pagination, filtering, search. Admin-only.
 */
export declare const listDonations: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * PATCH /api/donations/:id/status
 * Admin action: approve, reject, or mark unsuccessful.
 * Triggers receipt generation on approval, email notifications, audit logging.
 */
export declare const updateDonationStatus: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=donation.controller.d.ts.map