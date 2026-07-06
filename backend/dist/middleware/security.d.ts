import { RequestHandler } from 'express';
/**
 * Security middleware stack:
 * - Helmet for secure HTTP headers
 * - Content-Security-Policy (strict but allows Google Fonts for the design system)
 * - HSTS for production HTTPS enforcement
 */
export declare function createSecurityMiddleware(): RequestHandler;
//# sourceMappingURL=security.d.ts.map