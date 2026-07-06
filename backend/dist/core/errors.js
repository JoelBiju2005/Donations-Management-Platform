"use strict";
/**
 * Custom error classes for structured error handling throughout the application.
 * All errors extend AppError which provides a consistent shape for the error handler middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.VerificationError = exports.FileUploadError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', true, details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests. Please try again later.') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.RateLimitError = RateLimitError;
class FileUploadError extends AppError {
    constructor(message) {
        super(message, 400, 'FILE_UPLOAD_ERROR');
    }
}
exports.FileUploadError = FileUploadError;
class VerificationError extends AppError {
    constructor(message, details) {
        super(message, 422, 'VERIFICATION_ERROR', true, details);
    }
}
exports.VerificationError = VerificationError;
class ExternalServiceError extends AppError {
    constructor(service, message) {
        super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    }
}
exports.ExternalServiceError = ExternalServiceError;
//# sourceMappingURL=errors.js.map