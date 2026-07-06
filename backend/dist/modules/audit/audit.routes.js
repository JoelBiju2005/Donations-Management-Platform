"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = require("express");
const audit_controller_1 = require("./audit.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
exports.auditRoutes = router;
// GET /api/audit — admin only, read-only
router.get('/', auth_1.authMiddleware, audit_controller_1.listAuditLogs);
//# sourceMappingURL=audit.routes.js.map