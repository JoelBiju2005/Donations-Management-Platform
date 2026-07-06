"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startVerificationWorker = startVerificationWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const VerificationPipeline_1 = require("../services/verification/VerificationPipeline");
const logger_1 = require("../core/logger");
const QUEUE_NAME = 'verification';
/**
 * Start the BullMQ verification worker.
 * Processes verification jobs from the Redis-backed queue.
 */
function startVerificationWorker() {
    if (!(0, redis_1.isRedisAvailable)()) {
        logger_1.logger.warn('Redis not available — verification worker not started');
        return;
    }
    const redis = (0, redis_1.getRedisClient)();
    if (!redis)
        return;
    const worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
        const { donationId } = job.data;
        const jobLogger = logger_1.logger.child({ jobId: job.id, donationId, queue: QUEUE_NAME });
        jobLogger.info('Processing verification job');
        try {
            const result = await (0, VerificationPipeline_1.runVerificationPipeline)(donationId);
            jobLogger.info({ decision: result.decision, confidence: result.overallConfidence }, 'Verification job completed');
            return result;
        }
        catch (error) {
            jobLogger.error({ error }, 'Verification job failed');
            throw error; // BullMQ will retry based on job options
        }
    }, {
        connection: redis,
        concurrency: 2, // Process up to 2 verification jobs simultaneously
        limiter: {
            max: 10,
            duration: 60000, // Max 10 jobs per minute
        },
    });
    worker.on('completed', (job) => {
        logger_1.logger.debug({ jobId: job.id }, 'Verification worker: job completed');
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error({ jobId: job?.id, error: err.message }, 'Verification worker: job failed');
    });
    worker.on('stalled', (jobId) => {
        logger_1.logger.warn({ jobId }, 'Verification worker: job stalled');
    });
    worker.on('error', (err) => {
        logger_1.logger.error({ error: err }, 'Verification worker error');
    });
    logger_1.logger.info('Verification worker started');
}
//# sourceMappingURL=verification.worker.js.map