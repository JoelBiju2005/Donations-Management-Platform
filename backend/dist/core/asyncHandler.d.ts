import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Wraps an async Express route handler so rejected promises are
 * automatically forwarded to the global error handler.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map