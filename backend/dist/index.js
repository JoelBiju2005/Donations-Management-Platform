"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./core/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestId_1 = require("./middleware/requestId");
const rateLimiter_1 = require("./middleware/rateLimiter");
const security_1 = require("./middleware/security");
const cors_1 = require("./middleware/cors");
// Route imports
const auth_routes_1 = require("./modules/auth/auth.routes");
const donation_routes_1 = require("./modules/donation/donation.routes");
const settings_routes_1 = require("./modules/settings/settings.routes");
const audit_routes_1 = require("./modules/audit/audit.routes");
const stats_routes_1 = require("./modules/stats/stats.routes");
const reports_routes_1 = require("./modules/reports/reports.routes");
const health_controller_1 = require("./modules/health/health.controller");
// Workers & jobs
const verification_worker_1 = require("./workers/verification.worker");
const scheduler_1 = require("./jobs/scheduler");
async function bootstrap() {
    // Validate environment first
    const config = (0, env_1.getConfig)();
    logger_1.logger.info({ env: config.NODE_ENV }, '🚀 Starting Temple Donations API');
    // Connect to databases
    await (0, database_1.connectDatabase)();
    const redis = await (0, redis_1.connectRedis)();
    // Create Express app
    const app = (0, express_1.default)();
    // ─── Global Middleware ────────────────────────────────────
    app.use(requestId_1.requestIdMiddleware);
    app.use((0, security_1.createSecurityMiddleware)());
    app.use((0, cors_1.createCorsMiddleware)());
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, rateLimiter_1.createPublicRateLimiter)());
    // Serve uploaded files (development only — production uses S3/CDN)
    if (config.STORAGE_PROVIDER === 'local') {
        app.use('/uploads', express_1.default.static(path_1.default.resolve(config.UPLOAD_DIR)));
    }
    // ─── API Routes ──────────────────────────────────────────
    app.use('/api/health', health_controller_1.healthRoutes);
    app.use('/api/auth', auth_routes_1.authRoutes);
    app.use('/api/donations', donation_routes_1.donationRoutes);
    app.use('/api/settings', settings_routes_1.settingsRoutes);
    app.use('/api/audit', audit_routes_1.auditRoutes);
    app.use('/api/stats', stats_routes_1.statsRoutes);
    app.use('/api/reports', reports_routes_1.reportsRoutes);
    // ─── Error Handler (must be last) ────────────────────────
    app.use(errorHandler_1.errorHandler);
    // ─── Start Background Workers ────────────────────────────
    if (redis) {
        (0, verification_worker_1.startVerificationWorker)();
        logger_1.logger.info('✅ Verification worker started (Redis-backed)');
    }
    else {
        logger_1.logger.info('⚠️  Verification worker running in-process (no Redis)');
    }
    // Start scheduled jobs (cron)
    (0, scheduler_1.startScheduledJobs)();
    // ─── Start HTTP Server ───────────────────────────────────
    const server = app.listen(config.PORT, () => {
        logger_1.logger.info({ port: config.PORT }, `✅ Server listening on port ${config.PORT}`);
    });
    // ─── Graceful Shutdown ───────────────────────────────────
    const gracefulShutdown = async (signal) => {
        logger_1.logger.info({ signal }, 'Received shutdown signal, closing gracefully...');
        server.close(async () => {
            await (0, database_1.disconnectDatabase)();
            await (0, redis_1.disconnectRedis)();
            logger_1.logger.info('Server shut down gracefully');
            process.exit(0);
        });
        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error({ reason, promise }, 'Unhandled Promise Rejection');
    });
    process.on('uncaughtException', (error) => {
        logger_1.logger.fatal({ error }, 'Uncaught Exception — shutting down');
        process.exit(1);
    });
}
bootstrap().catch((error) => {
    logger_1.logger.fatal({ error }, 'Failed to start application');
    process.exit(1);
});
//# sourceMappingURL=index.js.map