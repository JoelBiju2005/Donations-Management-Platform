import { Router } from 'express';
import { getDashboardStats, getPublicStats } from './stats.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// GET /api/stats/public — aggregate stats for homepage (no auth)
router.get('/public', getPublicStats);

// GET /api/stats — full dashboard stats (admin only)
router.get('/', authMiddleware, getDashboardStats);

export { router as statsRoutes };
