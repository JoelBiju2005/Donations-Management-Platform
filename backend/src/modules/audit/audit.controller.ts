import { Request, Response } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuditLog } from '../../models/AuditLog';

/**
 * GET /api/audit
 * List audit logs with pagination and filtering. Admin-only.
 */
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '50',
    action,
    targetType,
    targetId,
    actor,
    startDate,
    endDate,
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  if (actor) filter.actor = actor;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) (filter.timestamp as any).$gte = new Date(startDate);
    if (endDate) (filter.timestamp as any).$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});
