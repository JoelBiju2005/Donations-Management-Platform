"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../../config/redis");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
/**
 * GET /api/health — basic health check for load balancers/orchestrators.
 * Always returns 200 if the process is running.
 */
router.get('/', (_req, res) => {
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
router.get('/ready', async (_req, res) => {
    const checks = {};
    // MongoDB check
    try {
        const mongoState = mongoose_1.default.connection.readyState;
        checks.mongodb = {
            status: mongoState === 1 ? 'connected' : 'disconnected',
        };
    }
    catch (error) {
        checks.mongodb = { status: 'error', message: error.message };
    }
    // Redis check (optional)
    const redis = (0, redis_1.getRedisClient)();
    if (redis) {
        try {
            await redis.ping();
            checks.redis = { status: 'connected' };
        }
        catch (error) {
            checks.redis = { status: 'error', message: error.message };
        }
    }
    else {
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
//# sourceMappingURL=health.controller.js.map