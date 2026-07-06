import { Queue } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { runVerificationPipeline } from '../services/verification/VerificationPipeline';
import { logger } from '../core/logger';

const QUEUE_NAME = 'verification';

let verificationQueue: Queue | null = null;

/**
 * Get or create the BullMQ verification queue.
 */
export function getVerificationQueue(): Queue | null {
  if (!isRedisAvailable()) return null;

  if (!verificationQueue) {
    const redis = getRedisClient();
    if (!redis) return null;

    verificationQueue = new Queue(QUEUE_NAME, {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  return verificationQueue;
}

/**
 * Enqueue a verification job (Redis-backed).
 */
export async function enqueueVerificationJob(donationId: string): Promise<void> {
  const queue = getVerificationQueue();
  if (!queue) {
    logger.warn({ donationId }, 'Redis not available — processing verification in-process');
    processVerificationInProcess(donationId);
    return;
  }

  await queue.add('verify-donation', { donationId }, {
    jobId: `verify-${donationId}`, // Prevent duplicate jobs
  });

  logger.info({ donationId }, 'Verification job enqueued');
}

/**
 * In-process fallback when Redis is not available.
 * Runs the pipeline asynchronously without blocking the request.
 *
 * Decision: This is suitable for development/low-traffic scenarios.
 * Production should always use Redis-backed BullMQ for reliability.
 */
export function processVerificationInProcess(donationId: string): void {
  // Fire and forget — don't await
  setImmediate(async () => {
    try {
      logger.info({ donationId }, 'Starting in-process verification');
      await runVerificationPipeline(donationId);
      logger.info({ donationId }, 'In-process verification complete');
    } catch (error) {
      logger.error({ donationId, error }, 'In-process verification failed');
    }
  });
}
