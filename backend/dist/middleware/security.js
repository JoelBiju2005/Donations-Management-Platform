"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecurityMiddleware = createSecurityMiddleware;
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("../config/env");
/**
 * Security middleware stack:
 * - Helmet for secure HTTP headers
 * - Content-Security-Policy (strict but allows Google Fonts for the design system)
 * - HSTS for production HTTPS enforcement
 */
function createSecurityMiddleware() {
    const config = (0, env_1.getConfig)();
    const isProd = config.NODE_ENV === 'production';
    return (0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'", config.FRONTEND_URL],
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
//# sourceMappingURL=security.js.map