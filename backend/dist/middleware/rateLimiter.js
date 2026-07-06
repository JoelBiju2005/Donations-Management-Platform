"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicRateLimiter = createPublicRateLimiter;
exports.createUploadRateLimiter = createUploadRateLimiter;
exports.createLoginRateLimiter = createLoginRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
/**
 * Rate limiters for different endpoint categories.
 * Configured via environment variables so they can be tightened in production.
 */
/** Standard rate limit for public API endpoints */
function createPublicRateLimiter() {
    const config = (0, env_1.getConfig)();
    return (0, express_rate_limit_1.default)({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_PUBLIC,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
            },
        },
    });
}
/** Stricter rate limit for file upload endpoints to prevent abuse */
function createUploadRateLimiter() {
    const config = (0, env_1.getConfig)();
    return (0, express_rate_limit_1.default)({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_UPLOAD,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many upload attempts. Please wait before trying again.',
            },
        },
    });
}
/** Very strict rate limit for login endpoint to prevent brute-force */
function createLoginRateLimiter() {
    const config = (0, env_1.getConfig)();
    return (0, express_rate_limit_1.default)({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_LOGIN,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Only count failed attempts
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many login attempts. Please try again later.',
            },
        },
    });
}
//# sourceMappingURL=rateLimiter.js.map