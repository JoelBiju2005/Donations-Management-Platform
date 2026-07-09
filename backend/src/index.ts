import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { getConfig } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './core/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { createPublicRateLimiter } from './middleware/rateLimiter';
import { createSecurityMiddleware } from './middleware/security';
import { createCorsMiddleware } from './middleware/cors';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { donationRoutes } from './modules/donation/donation.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { statsRoutes } from './modules/stats/stats.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { healthRoutes } from './modules/health/health.controller';

// Workers & jobs
import { startVerificationWorker } from './workers/verification.worker';
import { startScheduledJobs } from './jobs/scheduler';
import { runSeed } from './scripts/seed';

async function bootstrap(): Promise<void> {
  // Validate environment first
  const config = getConfig();
  logger.info({ env: config.NODE_ENV }, '🚀 Starting Temple Donations API');

  // Connect to databases
  await connectDatabase();

  // Run auto-seeding
  try {
    await runSeed();
  } catch (error) {
    logger.error({ error }, '⚠️ Auto-seeding failed during startup');
  }

  const redis = await connectRedis();

  // Create Express app
  const app = express();

  // ─── Global Middleware ────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(createSecurityMiddleware());
  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(createPublicRateLimiter());

  // Serve uploaded files (development only — production uses S3/CDN)
  if (config.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', express.static(path.resolve(config.UPLOAD_DIR)));
  }

  // ─── API Routes ──────────────────────────────────────────
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/reports', reportsRoutes);

  // ─── Error Handler (must be last) ────────────────────────
  app.use(errorHandler);

  // ─── Start Background Workers ────────────────────────────
  if (redis) {
    startVerificationWorker();
    logger.info('✅ Verification worker started (Redis-backed)');
  } else {
    logger.info('⚠️  Verification worker running in-process (no Redis)');
  }

  // Start scheduled jobs (cron)
  startScheduledJobs();

  // ─── Start HTTP Server ───────────────────────────────────
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, `✅ Server listening on port ${config.PORT}`);
  });

  // ─── Graceful Shutdown ───────────────────────────────────
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, closing gracefully...');

    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Server shut down gracefully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start application');
  process.exit(1);
});
