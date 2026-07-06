import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';
import { logger } from '../core/logger';

/**
 * Global error handler middleware.
 * - Operational errors: return structured JSON response
 * - Programming errors: log full stack, return generic 500
 * - Never exposes stack traces or internal details in production
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Extract request ID for log correlation
  const requestId = (req as any).requestId || 'unknown';

  if (err instanceof AppError) {
    // Operational error — safe to expose message to client
    logger.warn(
      {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        details: err.details,
      },
      err.message
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    logger.warn({ requestId, err }, 'Mongoose validation error');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        details: err.message,
      },
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    logger.warn({ requestId, err }, 'Duplicate key error');
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this information already exists',
      },
    });
    return;
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    logger.warn({ requestId, err }, 'File upload error');
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid or expired authentication token',
      },
    });
    return;
  }

  // Unexpected/programming error — log fully, return generic message
  logger.error(
    {
      requestId,
      err,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'Unhandled error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
