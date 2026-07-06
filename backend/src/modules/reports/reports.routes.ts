import { Router } from 'express';
import { generateStatement, exportCsv } from './reports.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// POST /api/reports/statement — generate PDF statement
router.post('/statement', authMiddleware, generateStatement);

// GET /api/reports/export — export CSV
router.get('/export', authMiddleware, exportCsv);

export { router as reportsRoutes };
