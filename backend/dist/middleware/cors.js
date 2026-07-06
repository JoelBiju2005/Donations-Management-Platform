"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCorsMiddleware = createCorsMiddleware;
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../config/env");
/**
 * CORS configuration locked to the known frontend origin.
 * Allows credentials (cookies) for refresh token flow.
 */
function createCorsMiddleware() {
    const config = (0, env_1.getConfig)();
    return (0, cors_1.default)({
        origin: config.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key'],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400, // Cache preflight for 24 hours
    });
}
//# sourceMappingURL=cors.js.map