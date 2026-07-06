/**
 * Custom error classes for structured error handling throughout the application.
 * All errors extend AppError which provides a consistent shape for the error handler middleware.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code: string;
    readonly details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean, details?: unknown);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class FileUploadError extends AppError {
    constructor(message: string);
}
export declare class VerificationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string);
}
//# sourceMappingURL=errors.d.ts.map