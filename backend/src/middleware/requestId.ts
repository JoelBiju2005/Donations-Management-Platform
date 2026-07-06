import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger } from '../core/logger';

/**
 * Injects a unique request ID into every request for end-to-end tracing.
 * If the client sends X-Request-ID, it's used; otherwise a UUID is generated.
 * The request logger child is attached for correlated logging throughout the request lifecycle.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).requestId = requestId;
  (req as any).log = createRequestLogger(requestId);

  // Echo request ID in response for client-side correlation
  _res.setHeader('X-Request-ID', requestId);

  next();
}
