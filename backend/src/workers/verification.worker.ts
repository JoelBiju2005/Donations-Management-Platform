import { Worker, Job } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { runVerificationPipeline } from '../services/verification/VerificationPipeline';
import { logger } from '../core/logger';

const QUEUE_NAME = 'verification';

/**
 * Start the BullMQ verification worker.
 * Processes verification jobs from the Redis-backed queue.
 */
export function startVerificationWorker(): void {
  if (!isRedisAvailable()) {
    logger.warn('Redis not available — verification worker not started');
    return;
  }

  const redis = getRedisClient();
  if (!redis) return;

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { donationId } = job.data;
      const jobLogger = logger.child({ jobId: job.id, donationId, queue: QUEUE_NAME });

      jobLogger.info('Processing verification job');

      try {
        const result = await runVerificationPipeline(donationId);
        jobLogger.info(
          { decision: result.decision, confidence: result.overallConfidence },
          'Verification job completed'
        );
        return result;
      } catch (error) {
        jobLogger.error({ error }, 'Verification job failed');
        throw error; // BullMQ will retry based on job options
      }
    },
    {
      connection: redis as any,
      concurrency: 2, // Process up to 2 verification jobs simultaneously
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute
      },
    }
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Verification worker: job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Verification worker: job failed');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Verification worker: job stalled');
  });

  worker.on('error', (err) => {
    logger.error({ error: err }, 'Verification worker error');
  });

  logger.info('Verification worker started');
}
