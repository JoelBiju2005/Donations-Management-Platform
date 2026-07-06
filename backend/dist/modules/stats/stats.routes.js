"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const express_1 = require("express");
const stats_controller_1 = require("./stats.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
exports.statsRoutes = router;
// GET /api/stats/public — aggregate stats for homepage (no auth)
router.get('/public', stats_controller_1.getPublicStats);
// GET /api/stats — full dashboard stats (admin only)
router.get('/', auth_1.authMiddleware, stats_controller_1.getDashboardStats);
//# sourceMappingURL=stats.routes.js.map