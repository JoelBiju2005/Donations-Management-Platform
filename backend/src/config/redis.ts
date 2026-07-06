import Redis from 'ioredis';
import { getConfig } from './env';
import { logger } from '../core/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Connect to Redis. Non-blocking — the app continues without Redis
 * (verification jobs fall back to in-process execution).
 *
 * Decision: Redis is optional for local development. BullMQ requires it
 * for production job queuing, but we gracefully degrade to synchronous
 * processing when Redis isn't available.
 */
export async function connectRedis(): Promise<Redis | null> {
  const config = getConfig();

  if (!config.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not set — using in-process queue (not suitable for production)');
    return null;
  }

  try {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ compatibility
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 10) {
          logger.error('Redis retry limit reached, giving up');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 5000);
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      redisClient!.on('ready', () => {
        clearTimeout(timeout);
        redisAvailable = true;
        logger.info('✅ Connected to Redis');
        resolve();
      });

      redisClient!.on('error', (err) => {
        clearTimeout(timeout);
        logger.error({ err }, 'Redis connection error');
        reject(err);
      });
    });

    return redisClient;
  } catch (error) {
    logger.warn('⚠️  Redis connection failed — falling back to in-process queue');
    redisClient = null;
    redisAvailable = false;
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}
