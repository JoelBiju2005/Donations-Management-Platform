"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
require("dotenv/config");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
/**
 * Environment variable schema — validated at startup.
 * Missing required variables will crash the app immediately with a clear error.
 */
const envSchema = zod_1.z.object({
    // Server
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    // MongoDB
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/temple-donations'),
    // Redis (optional — falls back to in-process queue if unavailable)
    REDIS_URL: zod_1.z.string().optional(),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    // Admin Seed
    SEED_ADMIN_EMAIL: zod_1.z.string().email().default('admin@temple.local'),
    SEED_ADMIN_PASSWORD: zod_1.z.string().min(8).default('ChangeMe!2026'),
    // Email (Brevo) — optional for dev, required for production
    BREVO_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM_ADDRESS: zod_1.z.string().email().default('noreply@temple.local'),
    EMAIL_FROM_NAME: zod_1.z.string().default('Sri Devi Temple'),
    // Storage
    STORAGE_PROVIDER: zod_1.z.enum(['local', 's3']).default('s3'), // Default to s3 for production
    UPLOAD_DIR: zod_1.z.string().default(path_1.default.resolve(process.cwd(), 'uploads')),
    // AWS S3 standard environment variables
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_S3_BUCKET_NAME: zod_1.z.string().optional(),
    // Google Gemini API Key
    GEMINI_API_KEY: zod_1.z.string().optional(),
    // Verification thresholds (configurable, also editable in admin settings)
    OCR_CONFIDENCE_THRESHOLD: zod_1.z.coerce.number().min(0).max(100).default(60),
    FRAUD_RISK_THRESHOLD: zod_1.z.coerce.number().min(0).max(100).default(70),
    TIMESTAMP_MAX_AGE_HOURS: zod_1.z.coerce.number().default(48),
    AMOUNT_MISMATCH_TOLERANCE_PAISE: zod_1.z.coerce.number().default(100), // ₹1 tolerance
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_PUBLIC: zod_1.z.coerce.number().default(100),
    RATE_LIMIT_MAX_UPLOAD: zod_1.z.coerce.number().default(10),
    RATE_LIMIT_MAX_LOGIN: zod_1.z.coerce.number().default(5),
    // Account lockout
    LOGIN_MAX_ATTEMPTS: zod_1.z.coerce.number().default(5),
    LOGIN_LOCKOUT_MINUTES: zod_1.z.coerce.number().default(30),
});
let _config = null;
/**
 * Validate and cache environment configuration.
 * Crashes on first call if required variables are missing.
 */
function getConfig() {
    if (_config)
        return _config;
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
//# sourceMappingURL=env.js.map