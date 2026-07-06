/**
 * Connect to MongoDB with retry logic.
 * Retries up to 5 times with exponential backoff before crashing.
 */
export declare function connectDatabase(): Promise<void>;
/**
 * Gracefully close the database connection.
 */
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map