"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
/**
 * Structured logger using Pino.
 * - Development: pretty-printed with colors
 * - Production: JSON lines for log aggregation
 * - Request IDs are correlated end-to-end through async verification jobs
 */
function createLogger() {
    let config;
    try {
        config = (0, env_1.getConfig)();
    }
    catch {
        // Logger may be imported before config is validated (e.g., during config validation itself)
        config = { NODE_ENV: process.env.NODE_ENV || 'development' };
    }
    const isDev = config.NODE_ENV === 'development';
    return (0, pino_1.default)({
        level: isDev ? 'debug' : 'info',
        ...(isDev
            ? {
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss.l',
                        ignore: 'pid,hostname',
                    },
                },
            }
            : {}),
        // Base fields included in every log line
        base: {
            service: 'temple-donations-api',
        },
        // Redact sensitive fields from logs
        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'password',
                'passwordHash',
                'refreshTokenHash',
                'donor.email',
                'donor.phone',
            ],
            censor: '[REDACTED]',
        },
    });
}
exports.logger = createLogger();
/**
 * Create a child logger with a request ID for end-to-end tracing.
 */
function createRequestLogger(requestId) {
    return exports.logger.child({ requestId });
}
//# sourceMappingURL=logger.js.map