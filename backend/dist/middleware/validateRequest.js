"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateFullRequest = validateFullRequest;
const errors_1 = require("../core/errors");
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
function validateRequest(schema, source = 'body') {
    return (req, _res, next) => {
        const data = req[source];
        const result = schema.safeParse(data);
        if (!result.success) {
            const formattedErrors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            next(new errors_1.ValidationError('Invalid request data', formattedErrors));
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
function validateFullRequest(schema) {
    return (req, _res, next) => {
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
            next(new errors_1.ValidationError('Invalid request data', formattedErrors));
            return;
        }
        req.body = result.data.body;
        req.query = result.data.query;
        req.params = result.data.params;
        next();
    };
}
//# sourceMappingURL=validateRequest.js.map