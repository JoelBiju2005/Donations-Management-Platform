import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Creates a validation middleware using a Zod schema.
 * Validates req.body, req.query, and/or req.params depending on the schema shape.
 *
 * Usage:
 *   router.post('/path', validateRequest(mySchema), handler);
 *
 * The schema should validate { body?, query?, params? }.
 * For simple body-only validation, pass the schema directly and it validates req.body.
 */
export declare function validateRequest(schema: ZodSchema, source?: 'body' | 'query' | 'params'): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Full request validation (body + query + params simultaneously).
 */
export declare function validateFullRequest(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map