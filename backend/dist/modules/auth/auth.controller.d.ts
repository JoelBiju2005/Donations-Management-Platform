/**
 * POST /api/auth/login
 * Admin login with email + password.
 * Uses generic error messages to prevent email enumeration.
 */
export declare const login: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * POST /api/auth/refresh
 * Refresh the access token using the httpOnly refresh token cookie.
 * Implements token rotation — old refresh token is invalidated.
 */
export declare const refresh: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * POST /api/auth/logout
 * Invalidate the refresh token and clear the cookie.
 */
export declare const logout: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/auth/me
 * Return current admin user info (used by frontend to verify session).
 */
export declare const getMe: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * PUT /api/auth/credentials
 * Update admin email and/or password after verifying old password.
 */
export declare const updateCredentials: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=auth.controller.d.ts.map