"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = void 0;
const asyncHandler_1 = require("../../core/asyncHandler");
const AuditLog_1 = require("../../models/AuditLog");
/**
 * GET /api/audit
 * List audit logs with pagination and filtering. Admin-only.
 */
exports.listAuditLogs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '50', action, targetType, targetId, actor, startDate, endDate, } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    // Build filter
    const filter = {};
    if (action)
        filter.action = action;
    if (targetType)
        filter.targetType = targetType;
    if (targetId)
        filter.targetId = targetId;
    if (actor)
        filter.actor = actor;
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate)
            filter.timestamp.$gte = new Date(startDate);
        if (endDate)
            filter.timestamp.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
        AuditLog_1.AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        AuditLog_1.AuditLog.countDocuments(filter),
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
//# sourceMappingURL=audit.controller.js.map