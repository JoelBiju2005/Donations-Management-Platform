import { Request, Response } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuthenticationError, ValidationError } from '../../core/errors';
import { AdminUser } from '../../models/AdminUser';
import { createAuditEntry } from '../../models/AuditLog';
import { getConfig } from '../../config/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../../core/logger';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT access + refresh token pair.
 */
function generateTokens(userId: string, email: string, role: string): TokenPair {
  const config = getConfig();

  const accessToken = jwt.sign(
    { sub: userId, email, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRY } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRY } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/login
 * Admin login with email + password.
 * Uses generic error messages to prevent email enumeration.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const config = getConfig();

  // Generic error message — never reveal whether the email exists
  const genericError = 'Invalid email or password';

  const admin = await AdminUser.findOne({ email: email.toLowerCase() });

  if (!admin) {
    throw new AuthenticationError(genericError);
  }

  // Check account lockout
  if (admin.isLocked()) {
    throw new AuthenticationError(
      'Account is temporarily locked due to too many failed attempts. Please try again later.'
    );
  }

  // Check if account is active
  if (!admin.isActive) {
    throw new AuthenticationError(genericError);
  }

  // Verify password
  const isValid = await admin.comparePassword(password);
  if (!isValid) {
    await admin.incrementFailedAttempts(config.LOGIN_LOCKOUT_MINUTES, config.LOGIN_MAX_ATTEMPTS);
    throw new AuthenticationError(genericError);
  }

  // Successful login — reset failed attempts
  await admin.resetFailedAttempts();

  // Generate tokens
  const tokens = generateTokens(admin._id.toString(), admin.email, admin.role);

  // Store refresh token hash for revocation
  const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
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
  await createAuditEntry({
    actor: admin._id.toString(),
    actorEmail: admin.email,
    action: 'auth.login',
    targetType: 'AdminUser',
    targetId: admin._id.toString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
  });

  logger.info({ adminId: admin._id, email: admin.email }, 'Admin login successful');

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
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const config = getConfig();
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required');
  }

  // Verify JWT
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type');
  }

  // Find admin and verify refresh token hash matches
  const admin = await AdminUser.findById(decoded.sub);
  if (!admin || !admin.isActive || !admin.refreshTokenHash) {
    throw new AuthenticationError('Invalid refresh token');
  }

  const isValidRefresh = await bcrypt.compare(refreshToken, admin.refreshTokenHash);
  if (!isValidRefresh) {
    // Potential token reuse attack — invalidate all sessions
    admin.refreshTokenHash = undefined;
    await admin.save();
    logger.warn({ adminId: admin._id }, 'Refresh token reuse detected — all sessions invalidated');
    throw new AuthenticationError('Invalid refresh token. Please log in again.');
  }

  // Generate new token pair (rotation)
  const tokens = generateTokens(admin._id.toString(), admin.email, admin.role);

  // Store new refresh token hash
  admin.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
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
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const admin = (req as any).admin;

  if (admin) {
    await AdminUser.findByIdAndUpdate(admin.id, {
      $unset: { refreshTokenHash: 1 },
    });

    await createAuditEntry({
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
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = (req as any).admin;

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
export const updateCredentials = asyncHandler(async (req: Request, res: Response) => {
  const currentAdmin = (req as any).admin;
  const { email, oldPassword, newPassword } = req.body;

  const admin = await AdminUser.findById(currentAdmin.id);
  if (!admin) {
    throw new AuthenticationError('Admin user not found');
  }

  // Verify old password
  const isValid = await admin.comparePassword(oldPassword);
  if (!isValid) {
    throw new AuthenticationError('Invalid old password');
  }

  // Update email
  if (email && email.toLowerCase() !== admin.email) {
    const emailExists = await AdminUser.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      throw new ValidationError('Email is already in use by another admin');
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

  await createAuditEntry({
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
