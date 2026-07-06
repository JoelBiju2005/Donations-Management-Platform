import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    sub: string;
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
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth middleware — doesn't throw if no token present.
 * Useful for endpoints that work differently for authenticated vs. anonymous users.
 */
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map