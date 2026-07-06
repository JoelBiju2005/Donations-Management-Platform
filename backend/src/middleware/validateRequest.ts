import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../core/errors';

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
export function validateRequest(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      next(new ValidationError('Invalid request data', formattedErrors));
      return;
    }

    // Replace parsed data (handles coercion, defaults, stripping unknown fields)
    req[source] = result.data;
    next();
  };
}

/**
 * Full request validation (body + query + params simultaneously).
 */
export function validateFullRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      next(new ValidationError('Invalid request data', formattedErrors));
      return;
    }

    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;
    next();
  };
}
