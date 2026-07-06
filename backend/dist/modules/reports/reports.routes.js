"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRoutes = void 0;
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
exports.reportsRoutes = router;
// POST /api/reports/statement — generate PDF statement
router.post('/statement', auth_1.authMiddleware, reports_controller_1.generateStatement);
// GET /api/reports/export — export CSV
router.get('/export', auth_1.authMiddleware, reports_controller_1.exportCsv);
//# sourceMappingURL=reports.routes.js.map