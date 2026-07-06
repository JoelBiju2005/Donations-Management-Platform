"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../core/logger");
/**
 * Connect to MongoDB with retry logic.
 * Retries up to 5 times with exponential backoff before crashing.
 */
async function connectDatabase() {
    const config = (0, env_1.getConfig)();
    const maxRetries = 5;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await mongoose_1.default.connect(config.MONGODB_URI, {
                // Mongoose 8 defaults are sensible; only override what's needed
                serverSelectionTimeoutMS: 5000,
                heartbeatFrequencyMS: 10000,
            });
            logger_1.logger.info('✅ Connected to MongoDB');
            // Connection event handlers
            mongoose_1.default.connection.on('error', (err) => {
                logger_1.logger.error({ err }, 'MongoDB connection error');
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.logger.warn('MongoDB disconnected');
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.logger.info('MongoDB reconnected');
            });
            return;
        }
        catch (error) {
            retries++;
            const delay = Math.min(1000 * Math.pow(2, retries), 30000);
            logger_1.logger.warn({ attempt: retries, maxRetries, delayMs: delay }, `MongoDB connection failed, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    logger_1.logger.fatal('❌ Could not connect to MongoDB after maximum retries');
    process.exit(1);
}
/**
 * Gracefully close the database connection.
 */
async function disconnectDatabase() {
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('MongoDB connection closed');
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error closing MongoDB connection');
    }
}
//# sourceMappingURL=database.js.map