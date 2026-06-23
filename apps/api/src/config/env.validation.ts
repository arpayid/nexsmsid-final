import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().min(1).default("api/v1"),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587).optional(),
  SMTP_SECURE: z.enum(["true", "false"]).default("false").optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default("noreply@nexsmsid.dev").optional(),
  WA_API_KEY: z.string().optional(),
  WA_API_URL: z.string().url().default("https://api.fonnte.com/send").optional(),
  // nestjs-pino customLevels only support these levels in production/runtime.
  LOG_LEVEL: z.enum(["error", "warn", "debug"]).default("warn"),
  STORAGE_PATH: z.string().default("./storage"),
  REPORT_STORAGE_PATH: z.string().default("./storage/reports"),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  PPDB_LEGACY_PIN_GRACE_END: z.string().datetime().optional(),
  PPDB_AUTO_PROVISION_STUDENT_ACCOUNT: z.enum(["true", "false"]).default("true"),
  PPDB_PROVISION_EMAIL_REQUIRED: z.enum(["true", "false"]).default("true"),
  PPDB_PROVISION_EMAIL_DOMAIN: z.string().optional(),

  // Sentry (production monitoring)
  SENTRY_DSN: z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional()),
  SENTRY_ENVIRONMENT: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnvironment(config: Record<string, unknown>) {
  // In production, ensure some variables are explicitly set and not defaults
  if (config.NODE_ENV === "production") {
    if (!config.WEB_ORIGIN || config.WEB_ORIGIN === "http://localhost:3000") {
      throw new Error("WEB_ORIGIN must be a production URL in production mode");
    }
    if (config.JWT_ACCESS_SECRET === "phase-3-change-me-access-secret" || (config.JWT_ACCESS_SECRET as string)?.length < 64) {
      throw new Error("JWT_ACCESS_SECRET must be at least 64 characters in production mode");
    }
    if (config.JWT_REFRESH_SECRET === "phase-3-change-me-refresh-secret" || (config.JWT_REFRESH_SECRET as string)?.length < 64) {
      throw new Error("JWT_REFRESH_SECRET must be at least 64 characters in production mode");
    }
    if (config.JWT_REFRESH_SECRET === config.JWT_ACCESS_SECRET) {
      throw new Error("JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET in production mode");
    }
    if (!["error", "warn", "debug", undefined].includes(config.LOG_LEVEL as string | undefined)) {
      throw new Error("LOG_LEVEL must be one of: error, warn, debug in production mode");
    }
    if (!config.TURNSTILE_SECRET_KEY?.toString().trim()) {
      throw new Error("TURNSTILE_SECRET_KEY must be set in production mode");
    }
  }

  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
}
