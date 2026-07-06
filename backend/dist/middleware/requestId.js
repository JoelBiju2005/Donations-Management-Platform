"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
const logger_1 = require("../core/logger");
/**
 * Injects a unique request ID into every request for end-to-end tracing.
 * If the client sends X-Request-ID, it's used; otherwise a UUID is generated.
 * The request logger child is attached for correlated logging throughout the request lifecycle.
 */
function requestIdMiddleware(req, _res, next) {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.requestId = requestId;
    req.log = (0, logger_1.createRequestLogger)(requestId);
    // Echo request ID in response for client-side correlation
    _res.setHeader('X-Request-ID', requestId);
    next();
}
//# sourceMappingURL=requestId.js.map