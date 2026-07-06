import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env';
import { AuthenticationError } from '../core/errors';
import { AdminUser } from '../models/AdminUser';

export interface JwtPayload {
  sub: string;       // Admin user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware for admin routes.
 * Verifies the access token from the Authorization header.
 * Attaches the decoded admin user to req.admin.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = getConfig();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    // Verify the admin still exists and is active
    const admin = await AdminUser.findById(decoded.sub).select('-passwordHash -refreshTokenHash');
    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Account is deactivated or does not exist');
    }

    // Attach admin to request
    (req as any).admin = {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid access token'));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Access token expired'));
      return;
    }
    next(error);
  }
}

/**
 * Optional auth middleware — doesn't throw if no token present.
 * Useful for endpoints that work differently for authenticated vs. anonymous users.
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  await authMiddleware(req, res, next);
}
