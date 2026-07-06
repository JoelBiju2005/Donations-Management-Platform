import { Queue } from 'bullmq';
/**
 * Get or create the BullMQ verification queue.
 */
export declare function getVerificationQueue(): Queue | null;
/**
 * Enqueue a verification job (Redis-backed).
 */
export declare function enqueueVerificationJob(donationId: string): Promise<void>;
/**
 * In-process fallback when Redis is not available.
 * Runs the pipeline asynchronously without blocking the request.
 *
 * Decision: This is suitable for development/low-traffic scenarios.
 * Production should always use Redis-backed BullMQ for reliability.
 */
export declare function processVerificationInProcess(donationId: string): void;
//# sourceMappingURL=verification.queue.d.ts.map