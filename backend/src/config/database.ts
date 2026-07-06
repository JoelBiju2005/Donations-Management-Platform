import mongoose from 'mongoose';
import { getConfig } from './env';
import { logger } from '../core/logger';

/**
 * Connect to MongoDB with retry logic.
 * Retries up to 5 times with exponential backoff before crashing.
 */
export async function connectDatabase(): Promise<void> {
  const config = getConfig();
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(config.MONGODB_URI, {
        // Mongoose 8 defaults are sensible; only override what's needed
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
      });

      logger.info('✅ Connected to MongoDB');

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB connection error');
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (error) {
      retries++;
      const delay = Math.min(1000 * Math.pow(2, retries), 30000);
      logger.warn(
        { attempt: retries, maxRetries, delayMs: delay },
        `MongoDB connection failed, retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.fatal('❌ Could not connect to MongoDB after maximum retries');
  process.exit(1);
}

/**
 * Gracefully close the database connection.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing MongoDB connection');
  }
}
