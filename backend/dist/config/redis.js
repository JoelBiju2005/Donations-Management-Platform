"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
exports.getRedisClient = getRedisClient;
exports.isRedisAvailable = isRedisAvailable;
exports.disconnectRedis = disconnectRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../core/logger");
let redisClient = null;
let redisAvailable = false;
/**
 * Connect to Redis. Non-blocking — the app continues without Redis
 * (verification jobs fall back to in-process execution).
 *
 * Decision: Redis is optional for local development. BullMQ requires it
 * for production job queuing, but we gracefully degrade to synchronous
 * processing when Redis isn't available.
 */
async function connectRedis() {
    const config = (0, env_1.getConfig)();
    if (!config.REDIS_URL) {
        logger_1.logger.warn('⚠️  REDIS_URL not set — using in-process queue (not suitable for production)');
        return null;
    }
    try {
        redisClient = new ioredis_1.default(config.REDIS_URL, {
            maxRetriesPerRequest: null, // Required for BullMQ compatibility
            enableReadyCheck: true,
            retryStrategy(times) {
                if (times > 10) {
                    logger_1.logger.error('Redis retry limit reached, giving up');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 5000);
            },
        });
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, 5000);
            redisClient.on('ready', () => {
                clearTimeout(timeout);
                redisAvailable = true;
                logger_1.logger.info('✅ Connected to Redis');
                resolve();
            });
            redisClient.on('error', (err) => {
                clearTimeout(timeout);
                logger_1.logger.error({ err }, 'Redis connection error');
                reject(err);
            });
        });
        return redisClient;
    }
    catch (error) {
        logger_1.logger.warn('⚠️  Redis connection failed — falling back to in-process queue');
        redisClient = null;
        redisAvailable = false;
        return null;
    }
}
function getRedisClient() {
    return redisClient;
}
function isRedisAvailable() {
    return redisAvailable;
}
async function disconnectRedis() {
    if (redisClient) {
        await redisClient.quit();
        logger_1.logger.info('Redis connection closed');
    }
}
//# sourceMappingURL=redis.js.map