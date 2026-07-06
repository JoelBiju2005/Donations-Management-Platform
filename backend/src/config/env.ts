import { z } from 'zod';
import path from 'path';

/**
 * Environment variable schema — validated at startup.
 * Missing required variables will crash the app immediately with a clear error.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/temple-donations'),

  // Redis (optional — falls back to in-process queue if unavailable)
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Admin Seed
  SEED_ADMIN_EMAIL: z.string().email().default('admin@temple.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe!2026'),

  // Email (Brevo) — optional for dev, required for production
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().default('noreply@temple.local'),
  EMAIL_FROM_NAME: z.string().default('Sri Devi Temple'),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),

  // S3-compatible storage (only when STORAGE_PROVIDER=s3)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // Verification thresholds (configurable, also editable in admin settings)
  OCR_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(100).default(60),
  FRAUD_RISK_THRESHOLD: z.coerce.number().min(0).max(100).default(70),
  TIMESTAMP_MAX_AGE_HOURS: z.coerce.number().default(48),
  AMOUNT_MISMATCH_TOLERANCE_PAISE: z.coerce.number().default(100), // ₹1 tolerance

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_PUBLIC: z.coerce.number().default(100),
  RATE_LIMIT_MAX_UPLOAD: z.coerce.number().default(10),
  RATE_LIMIT_MAX_LOGIN: z.coerce.number().default(5),

  // Account lockout
  LOGIN_MAX_ATTEMPTS: z.coerce.number().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().default(30),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

/**
 * Validate and cache environment configuration.
 * Crashes on first call if required variables are missing.
 */
export function getConfig(): EnvConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  → ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  _config = result.data;
  return _config;
}
