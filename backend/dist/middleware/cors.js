"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCorsMiddleware = createCorsMiddleware;
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../config/env");
/**
 * CORS configuration supporting multiple frontend origins.
 * Set FRONTEND_URL to a comma-separated list of allowed origins.
 * Example: "http://localhost:3000,https://daanam-digital.vercel.app"
 */
function createCorsMiddleware() {
    const config = (0, env_1.getConfig)();
    // Support comma-separated origins
    const allowedOrigins = config.FRONTEND_URL
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
    return (0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (server-to-server, curl, etc.)
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key'],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400, // Cache preflight for 24 hours
    });
}
//# sourceMappingURL=cors.js.map