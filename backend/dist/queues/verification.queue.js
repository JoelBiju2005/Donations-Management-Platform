"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationQueue = getVerificationQueue;
exports.enqueueVerificationJob = enqueueVerificationJob;
exports.processVerificationInProcess = processVerificationInProcess;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const VerificationPipeline_1 = require("../services/verification/VerificationPipeline");
const logger_1 = require("../core/logger");
const QUEUE_NAME = 'verification';
let verificationQueue = null;
/**
 * Get or create the BullMQ verification queue.
 */
function getVerificationQueue() {
    if (!(0, redis_1.isRedisAvailable)())
        return null;
    if (!verificationQueue) {
        const redis = (0, redis_1.getRedisClient)();
        if (!redis)
            return null;
        verificationQueue = new bullmq_1.Queue(QUEUE_NAME, {
            connection: redis,
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
async function enqueueVerificationJob(donationId) {
    const queue = getVerificationQueue();
    if (!queue) {
        logger_1.logger.warn({ donationId }, 'Redis not available — processing verification in-process');
        processVerificationInProcess(donationId);
        return;
    }
    await queue.add('verify-donation', { donationId }, {
        jobId: `verify-${donationId}`, // Prevent duplicate jobs
    });
    logger_1.logger.info({ donationId }, 'Verification job enqueued');
}
/**
 * In-process fallback when Redis is not available.
 * Runs the pipeline asynchronously without blocking the request.
 *
 * Decision: This is suitable for development/low-traffic scenarios.
 * Production should always use Redis-backed BullMQ for reliability.
 */
function processVerificationInProcess(donationId) {
    // Fire and forget — don't await
    setImmediate(async () => {
        try {
            logger_1.logger.info({ donationId }, 'Starting in-process verification');
            await (0, VerificationPipeline_1.runVerificationPipeline)(donationId);
            logger_1.logger.info({ donationId }, 'In-process verification complete');
        }
        catch (error) {
            logger_1.logger.error({ donationId, error }, 'In-process verification failed');
        }
    });
}
//# sourceMappingURL=verification.queue.js.map