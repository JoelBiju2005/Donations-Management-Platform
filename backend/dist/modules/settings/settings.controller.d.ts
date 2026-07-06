/**
 * GET /api/settings
 * Get temple settings. Public endpoint (used by homepage and donation flow).
 * Sensitive fields (bank account number) are masked for public access.
 */
export declare const getSettings: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * PUT /api/settings
 * Update temple settings. Admin-only.
 * Every change is recorded in the audit log.
 */
export declare const updateSettings: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/settings/public
 * Explicitly public endpoint — minimal settings for the donation flow.
 */
export declare const getPublicSettings: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * POST /api/settings/upload-qr
 * Upload UPI QR code image. Admin-only.
 */
export declare const uploadQrCode: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=settings.controller.d.ts.map