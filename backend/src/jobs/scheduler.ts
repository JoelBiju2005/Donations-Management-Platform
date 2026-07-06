import cron from 'node-cron';
import { Donation } from '../models/Donation';
import { logger } from '../core/logger';

/**
 * Start all scheduled jobs.
 */
export function startScheduledJobs(): void {
  // Clean stale "pending_verification" donations (stuck > 1 hour)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = await Donation.updateMany(
        {
          status: 'pending_verification',
          createdAt: { $lt: oneHourAgo },
          'verification.result': 'pending',
        },
        {
          $set: {
            status: 'pending_admin_review',
            'verification.result': 'pending_admin_review',
          },
          $push: {
            'verification.reasons': 'Verification timed out — moved to admin review',
          },
        }
      );

      if (result.modifiedCount > 0) {
        logger.info({ count: result.modifiedCount }, 'Moved stale pending donations to admin review');
      }
    } catch (error) {
      logger.error({ error }, 'Stale donation cleanup failed');
    }
  });

  logger.info('✅ Scheduled jobs started');
}
