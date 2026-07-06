"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCredentials = exports.getMe = exports.logout = exports.refresh = exports.login = void 0;
const asyncHandler_1 = require("../../core/asyncHandler");
const errors_1 = require("../../core/errors");
const AdminUser_1 = require("../../models/AdminUser");
const AuditLog_1 = require("../../models/AuditLog");
const env_1 = require("../../config/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../../core/logger");
/**
 * Generate JWT access + refresh token pair.
 */
function generateTokens(userId, email, role) {
    const config = (0, env_1.getConfig)();
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId, email, role }, config.JWT_SECRET, { expiresIn: config.JWT_ACCESS_EXPIRY });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, config.JWT_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRY });
    return { accessToken, refreshToken };
}
/**
 * POST /api/auth/login
 * Admin login with email + password.
 * Uses generic error messages to prevent email enumeration.
 */
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const config = (0, env_1.getConfig)();
    // Generic error message — never reveal whether the email exists
    const genericError = 'Invalid email or password';
    const admin = await AdminUser_1.AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
        throw new errors_1.AuthenticationError(genericError);
    }
    // Check account lockout
    if (admin.isLocked()) {
        throw new errors_1.AuthenticationError('Account is temporarily locked due to too many failed attempts. Please try again later.');
    }
    // Check if account is active
    if (!admin.isActive) {
        throw new errors_1.AuthenticationError(genericError);
    }
    // Verify password
    const isValid = await admin.comparePassword(password);
    if (!isValid) {
        await admin.incrementFailedAttempts(config.LOGIN_LOCKOUT_MINUTES, config.LOGIN_MAX_ATTEMPTS);
        throw new errors_1.AuthenticationError(genericError);
    }
    // Successful login — reset failed attempts
    await admin.resetFailedAttempts();
    // Generate tokens
    const tokens = generateTokens(admin._id.toString(), admin.email, admin.role);
    // Store refresh token hash for revocation
    const refreshHash = await bcryptjs_1.default.hash(tokens.refreshToken, 10);
    admin.refreshTokenHash = refreshHash;
    admin.lastLoginAt = new Date();
    await admin.save();
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth',
    });
    // Audit log
    await (0, AuditLog_1.createAuditEntry)({
        actor: admin._id.toString(),
        actorEmail: admin.email,
        action: 'auth.login',
        targetType: 'AdminUser',
        targetId: admin._id.toString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
    });
    logger_1.logger.info({ adminId: admin._id, email: admin.email }, 'Admin login successful');
    res.json({
        success: true,
        data: {
            accessToken: tokens.accessToken,
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
            },
        },
    });
});
/**
 * POST /api/auth/refresh
 * Refresh the access token using the httpOnly refresh token cookie.
 * Implements token rotation — old refresh token is invalidated.
 */
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const config = (0, env_1.getConfig)();
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new errors_1.AuthenticationError('Refresh token required');
    }
    // Verify JWT
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refreshToken, config.JWT_SECRET);
    }
    catch {
        throw new errors_1.AuthenticationError('Invalid or expired refresh token');
    }
    if (decoded.type !== 'refresh') {
        throw new errors_1.AuthenticationError('Invalid token type');
    }
    // Find admin and verify refresh token hash matches
    const admin = await AdminUser_1.AdminUser.findById(decoded.sub);
    if (!admin || !admin.isActive || !admin.refreshTokenHash) {
        throw new errors_1.AuthenticationError('Invalid refresh token');
    }
    const isValidRefresh = await bcryptjs_1.default.compare(refreshToken, admin.refreshTokenHash);
    if (!isValidRefresh) {
        // Potential token reuse attack — invalidate all sessions
        admin.refreshTokenHash = undefined;
        await admin.save();
        logger_1.logger.warn({ adminId: admin._id }, 'Refresh token reuse detected — all sessions invalidated');
        throw new errors_1.AuthenticationError('Invalid refresh token. Please log in again.');
    }
    // Generate new token pair (rotation)
    const tokens = generateTokens(admin._id.toString(), admin.email, admin.role);
    // Store new refresh token hash
    admin.refreshTokenHash = await bcryptjs_1.default.hash(tokens.refreshToken, 10);
    await admin.save();
    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    });
    res.json({
        success: true,
        data: {
            accessToken: tokens.accessToken,
        },
    });
});
/**
 * POST /api/auth/logout
 * Invalidate the refresh token and clear the cookie.
 */
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const admin = req.admin;
    if (admin) {
        await AdminUser_1.AdminUser.findByIdAndUpdate(admin.id, {
            $unset: { refreshTokenHash: 1 },
        });
        await (0, AuditLog_1.createAuditEntry)({
            actor: admin.id,
            actorEmail: admin.email,
            action: 'auth.logout',
            targetType: 'AdminUser',
            targetId: admin.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
        });
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'Logged out successfully' });
});
/**
 * GET /api/auth/me
 * Return current admin user info (used by frontend to verify session).
 */
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const admin = req.admin;
    res.json({
        success: true,
        data: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
        },
    });
});
/**
 * PUT /api/auth/credentials
 * Update admin email and/or password after verifying old password.
 */
exports.updateCredentials = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const currentAdmin = req.admin;
    const { email, oldPassword, newPassword } = req.body;
    const admin = await AdminUser_1.AdminUser.findById(currentAdmin.id);
    if (!admin) {
        throw new errors_1.AuthenticationError('Admin user not found');
    }
    // Verify old password
    const isValid = await admin.comparePassword(oldPassword);
    if (!isValid) {
        throw new errors_1.AuthenticationError('Invalid old password');
    }
    // Update email
    if (email && email.toLowerCase() !== admin.email) {
        const emailExists = await AdminUser_1.AdminUser.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            throw new errors_1.ValidationError('Email is already in use by another admin');
        }
        admin.email = email.toLowerCase();
    }
    // Update password if provided
    if (newPassword) {
        admin.passwordHash = newPassword; // Pre-save hook hashes it automatically
    }
    // Invalidate refresh token to force re-authentication
    admin.refreshTokenHash = undefined;
    await admin.save();
    await (0, AuditLog_1.createAuditEntry)({
        actor: admin._id.toString(),
        actorEmail: admin.email,
        action: 'auth.credentials_updated',
        targetType: 'AdminUser',
        targetId: admin._id.toString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
    });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({
        success: true,
        message: 'Credentials updated successfully. Please log in again.',
    });
});
//# sourceMappingURL=auth.controller.js.map