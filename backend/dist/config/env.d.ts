import { z } from 'zod';
/**
 * Environment variable schema — validated at startup.
 * Missing required variables will crash the app immediately with a clear error.
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    FRONTEND_URL: z.ZodDefault<z.ZodString>;
    MONGODB_URI: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodString;
    JWT_ACCESS_EXPIRY: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_EXPIRY: z.ZodDefault<z.ZodString>;
    SEED_ADMIN_EMAIL: z.ZodDefault<z.ZodString>;
    SEED_ADMIN_PASSWORD: z.ZodDefault<z.ZodString>;
    BREVO_API_KEY: z.ZodOptional<z.ZodString>;
    EMAIL_FROM_ADDRESS: z.ZodDefault<z.ZodString>;
    EMAIL_FROM_NAME: z.ZodDefault<z.ZodString>;
    STORAGE_PROVIDER: z.ZodDefault<z.ZodEnum<["local", "s3"]>>;
    UPLOAD_DIR: z.ZodDefault<z.ZodString>;
    AWS_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    AWS_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
    AWS_REGION: z.ZodOptional<z.ZodString>;
    AWS_S3_BUCKET_NAME: z.ZodOptional<z.ZodString>;
    GEMINI_API_KEY: z.ZodOptional<z.ZodString>;
    OCR_CONFIDENCE_THRESHOLD: z.ZodDefault<z.ZodNumber>;
    FRAUD_RISK_THRESHOLD: z.ZodDefault<z.ZodNumber>;
    TIMESTAMP_MAX_AGE_HOURS: z.ZodDefault<z.ZodNumber>;
    AMOUNT_MISMATCH_TOLERANCE_PAISE: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_MAX_PUBLIC: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_MAX_UPLOAD: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_MAX_LOGIN: z.ZodDefault<z.ZodNumber>;
    LOGIN_MAX_ATTEMPTS: z.ZodDefault<z.ZodNumber>;
    LOGIN_LOCKOUT_MINUTES: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    FRONTEND_URL: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    SEED_ADMIN_EMAIL: string;
    SEED_ADMIN_PASSWORD: string;
    EMAIL_FROM_ADDRESS: string;
    EMAIL_FROM_NAME: string;
    STORAGE_PROVIDER: "local" | "s3";
    UPLOAD_DIR: string;
    OCR_CONFIDENCE_THRESHOLD: number;
    FRAUD_RISK_THRESHOLD: number;
    TIMESTAMP_MAX_AGE_HOURS: number;
    AMOUNT_MISMATCH_TOLERANCE_PAISE: number;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_PUBLIC: number;
    RATE_LIMIT_MAX_UPLOAD: number;
    RATE_LIMIT_MAX_LOGIN: number;
    LOGIN_MAX_ATTEMPTS: number;
    LOGIN_LOCKOUT_MINUTES: number;
    REDIS_URL?: string | undefined;
    BREVO_API_KEY?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_REGION?: string | undefined;
    AWS_S3_BUCKET_NAME?: string | undefined;
    GEMINI_API_KEY?: string | undefined;
}, {
    JWT_SECRET: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    FRONTEND_URL?: string | undefined;
    MONGODB_URI?: string | undefined;
    REDIS_URL?: string | undefined;
    JWT_ACCESS_EXPIRY?: string | undefined;
    JWT_REFRESH_EXPIRY?: string | undefined;
    SEED_ADMIN_EMAIL?: string | undefined;
    SEED_ADMIN_PASSWORD?: string | undefined;
    BREVO_API_KEY?: string | undefined;
    EMAIL_FROM_ADDRESS?: string | undefined;
    EMAIL_FROM_NAME?: string | undefined;
    STORAGE_PROVIDER?: "local" | "s3" | undefined;
    UPLOAD_DIR?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_REGION?: string | undefined;
    AWS_S3_BUCKET_NAME?: string | undefined;
    GEMINI_API_KEY?: string | undefined;
    OCR_CONFIDENCE_THRESHOLD?: number | undefined;
    FRAUD_RISK_THRESHOLD?: number | undefined;
    TIMESTAMP_MAX_AGE_HOURS?: number | undefined;
    AMOUNT_MISMATCH_TOLERANCE_PAISE?: number | undefined;
    RATE_LIMIT_WINDOW_MS?: number | undefined;
    RATE_LIMIT_MAX_PUBLIC?: number | undefined;
    RATE_LIMIT_MAX_UPLOAD?: number | undefined;
    RATE_LIMIT_MAX_LOGIN?: number | undefined;
    LOGIN_MAX_ATTEMPTS?: number | undefined;
    LOGIN_LOCKOUT_MINUTES?: number | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
/**
 * Validate and cache environment configuration.
 * Crashes on first call if required variables are missing.
 */
export declare function getConfig(): EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map