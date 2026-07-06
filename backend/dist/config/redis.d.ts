import Redis from 'ioredis';
/**
 * Connect to Redis. Non-blocking — the app continues without Redis
 * (verification jobs fall back to in-process execution).
 *
 * Decision: Redis is optional for local development. BullMQ requires it
 * for production job queuing, but we gracefully degrade to synchronous
 * processing when Redis isn't available.
 */
export declare function connectRedis(): Promise<Redis | null>;
export declare function getRedisClient(): Redis | null;
export declare function isRedisAvailable(): boolean;
export declare function disconnectRedis(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map