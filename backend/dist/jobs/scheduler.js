"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduledJobs = startScheduledJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const Donation_1 = require("../models/Donation");
const logger_1 = require("../core/logger");
/**
 * Start all scheduled jobs.
 */
function startScheduledJobs() {
    // Clean stale "pending_verification" donations (stuck > 1 hour)
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const result = await Donation_1.Donation.updateMany({
                status: 'pending_verification',
                createdAt: { $lt: oneHourAgo },
                'verification.result': 'pending',
            }, {
                $set: {
                    status: 'pending_admin_review',
                    'verification.result': 'pending_admin_review',
                },
                $push: {
                    'verification.reasons': 'Verification timed out — moved to admin review',
                },
            });
            if (result.modifiedCount > 0) {
                logger_1.logger.info({ count: result.modifiedCount }, 'Moved stale pending donations to admin review');
            }
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Stale donation cleanup failed');
        }
    });
    logger_1.logger.info('✅ Scheduled jobs started');
}
//# sourceMappingURL=scheduler.js.map