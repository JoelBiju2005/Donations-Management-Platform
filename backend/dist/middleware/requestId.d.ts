import { Request, Response, NextFunction } from 'express';
/**
 * Injects a unique request ID into every request for end-to-end tracing.
 * If the client sends X-Request-ID, it's used; otherwise a UUID is generated.
 * The request logger child is attached for correlated logging throughout the request lifecycle.
 */
export declare function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=requestId.d.ts.map