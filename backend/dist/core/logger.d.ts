import pino from 'pino';
export declare const logger: pino.Logger<never, boolean>;
/**
 * Create a child logger with a request ID for end-to-end tracing.
 */
export declare function createRequestLogger(requestId: string): pino.Logger;
//# sourceMappingURL=logger.d.ts.map