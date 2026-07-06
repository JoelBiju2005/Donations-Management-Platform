"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
/**
 * Wraps an async Express route handler so rejected promises are
 * automatically forwarded to the global error handler.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map