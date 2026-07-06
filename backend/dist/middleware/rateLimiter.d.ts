/**
 * Rate limiters for different endpoint categories.
 * Configured via environment variables so they can be tightened in production.
 */
/** Standard rate limit for public API endpoints */
export declare function createPublicRateLimiter(): import("express-rate-limit").RateLimitRequestHandler;
/** Stricter rate limit for file upload endpoints to prevent abuse */
export declare function createUploadRateLimiter(): import("express-rate-limit").RateLimitRequestHandler;
/** Very strict rate limit for login endpoint to prevent brute-force */
export declare function createLoginRateLimiter(): import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map