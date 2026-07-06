import pino from 'pino';
import { getConfig } from '../config/env';

/**
 * Structured logger using Pino.
 * - Development: pretty-printed with colors
 * - Production: JSON lines for log aggregation
 * - Request IDs are correlated end-to-end through async verification jobs
 */
function createLogger(): pino.Logger {
  let config: { NODE_ENV: string };
  try {
    config = getConfig();
  } catch {
    // Logger may be imported before config is validated (e.g., during config validation itself)
    config = { NODE_ENV: process.env.NODE_ENV || 'development' };
  }

  const isDev = config.NODE_ENV === 'development';

  return pino({
    level: isDev ? 'debug' : 'info',
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
    // Base fields included in every log line
    base: {
      service: 'temple-donations-api',
    },
    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordHash',
        'refreshTokenHash',
        'donor.email',
        'donor.phone',
      ],
      censor: '[REDACTED]',
    },
  });
}

export const logger = createLogger();

/**
 * Create a child logger with a request ID for end-to-end tracing.
 */
export function createRequestLogger(requestId: string): pino.Logger {
  return logger.child({ requestId });
}
