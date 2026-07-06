import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler middleware.
 * - Operational errors: return structured JSON response
 * - Programming errors: log full stack, return generic 500
 * - Never exposes stack traces or internal details in production
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map