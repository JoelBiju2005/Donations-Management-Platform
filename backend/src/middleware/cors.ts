import cors from 'cors';
import { getConfig } from '../config/env';
import { RequestHandler } from 'express';

/**
 * CORS configuration locked to the known frontend origin.
 * Allows credentials (cookies) for refresh token flow.
 */
export function createCorsMiddleware(): RequestHandler {
  const config = getConfig();

  return cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // Cache preflight for 24 hours
  });
}
