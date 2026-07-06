import cors from 'cors';
import { getConfig } from '../config/env';
import { RequestHandler } from 'express';

/**
 * CORS configuration supporting multiple frontend origins.
 * Set FRONTEND_URL to a comma-separated list of allowed origins.
 * Example: "http://localhost:3000,https://daanam-digital.vercel.app"
 */
export function createCorsMiddleware(): RequestHandler {
  const config = getConfig();

  // Support comma-separated origins
  const allowedOrigins = config.FRONTEND_URL
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // Cache preflight for 24 hours
  });
}
