import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/env';

/**
 * Rate limiters for different endpoint categories.
 * Configured via environment variables so they can be tightened in production.
 */

/** Standard rate limit for public API endpoints */
export function createPublicRateLimiter() {
  const config = getConfig();
  return rateLimit({
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
export function createUploadRateLimiter() {
  const config = getConfig();
  return rateLimit({
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
export function createLoginRateLimiter() {
  const config = getConfig();
  return rateLimit({
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
