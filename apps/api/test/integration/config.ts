/**
 * Shared configuration for the integration test suite.
 *
 * The suite runs against a REAL PostgreSQL database and a compiled API server
 * (node dist/main.js) spawned by global-setup.ts. Both the spawned server and
 * the test files import these constants so they always agree on URLs/secrets.
 */

const DEFAULT_TEST_DATABASE_URL = "postgresql://nexsmsid:nexsmsid@localhost:5432/nexsmsid_test?schema=public";

function resolveTestDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (!fromEnv) return DEFAULT_TEST_DATABASE_URL;

  const dbName = databaseNameOf(fromEnv);
  // Never run the destructive global setup against a non-test database
  if (!dbName.includes("test")) return DEFAULT_TEST_DATABASE_URL;
  return fromEnv;
}

export function databaseNameOf(url: string): string {
  return new URL(url).pathname.replace(/^\//, "");
}

export const TEST_DATABASE_URL = resolveTestDatabaseUrl();

export const TEST_API_PORT = Number(process.env.TEST_API_PORT ?? 4100);
export const API_URL = `http://127.0.0.1:${TEST_API_PORT}`;
export const API_PREFIX = "api/v1";

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "integration-test-access-secret-0123456789abcdef0123456789abcdef";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "integration-test-refresh-secret-fedcba9876543210fedcba9876543210";
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Seed defaults (see prisma/seed.ts) — the seed guard only blocks these in production
export const SUPER_ADMIN_EMAIL = "superadmin@nexsmsid.dev";
export const SEED_DEFAULT_PASSWORD = "ChangeMe123!";
