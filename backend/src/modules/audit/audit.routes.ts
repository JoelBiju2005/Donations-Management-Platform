import { Router } from 'express';
import { listAuditLogs } from './audit.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// GET /api/audit — admin only, read-only
router.get('/', authMiddleware, listAuditLogs);

export { router as auditRoutes };
