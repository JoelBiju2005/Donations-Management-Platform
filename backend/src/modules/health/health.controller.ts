import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../../config/redis';

const router = Router();

/**
 * GET /api/health — basic health check for load balancers/orchestrators.
 * Always returns 200 if the process is running.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

/**
 * GET /api/health/ready — readiness check.
 * Returns 200 only if all critical dependencies are connected.
 * Used by orchestrators to determine if the app should receive traffic.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; message?: string }> = {};

  // MongoDB check
  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongodb = {
      status: mongoState === 1 ? 'connected' : 'disconnected',
    };
  } catch (error: any) {
    checks.mongodb = { status: 'error', message: error.message };
  }

  // Redis check (optional)
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = { status: 'connected' };
    } catch (error: any) {
      checks.redis = { status: 'error', message: error.message };
    }
  } else {
    checks.redis = { status: 'not_configured' };
  }

  // Determine overall readiness (MongoDB is required, Redis is optional)
  const isReady = checks.mongodb.status === 'connected';

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    data: {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRoutes };
