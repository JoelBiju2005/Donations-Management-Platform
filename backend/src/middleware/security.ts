import helmet from 'helmet';
import { getConfig } from '../config/env';
import { RequestHandler } from 'express';

/**
 * Security middleware stack:
 * - Helmet for secure HTTP headers
 * - Content-Security-Policy (strict but allows Google Fonts for the design system)
 * - HSTS for production HTTPS enforcement
 */
export function createSecurityMiddleware(): RequestHandler {
  const config = getConfig();
  const isProd = config.NODE_ENV === 'production';

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", ...config.FRONTEND_URL.split(',').map((u: string) => u.trim())],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow loading external fonts
    hsts: isProd
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true, // nosniff
    xFrameOptions: { action: 'deny' },
  });
}
