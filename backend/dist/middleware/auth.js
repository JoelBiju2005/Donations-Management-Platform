"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../core/errors");
const AdminUser_1 = require("../models/AdminUser");
/**
 * JWT authentication middleware for admin routes.
 * Verifies the access token from the Authorization header.
 * Attaches the decoded admin user to req.admin.
 */
async function authMiddleware(req, _res, next) {
    try {
        const config = (0, env_1.getConfig)();
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AuthenticationError('Access token required');
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, config.JWT_SECRET);
        // Verify the admin still exists and is active
        const admin = await AdminUser_1.AdminUser.findById(decoded.sub).select('-passwordHash -refreshTokenHash');
        if (!admin || !admin.isActive) {
            throw new errors_1.AuthenticationError('Account is deactivated or does not exist');
        }
        // Attach admin to request
        req.admin = {
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError) {
            next(error);
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.AuthenticationError('Invalid access token'));
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errors_1.AuthenticationError('Access token expired'));
            return;
        }
        next(error);
    }
}
/**
 * Optional auth middleware — doesn't throw if no token present.
 * Useful for endpoints that work differently for authenticated vs. anonymous users.
 */
async function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    await authMiddleware(req, res, next);
}
//# sourceMappingURL=auth.js.map