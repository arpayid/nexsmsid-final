/**
 * Vitest global setup for the integration suite.
 *
 * 1. Creates the test database if missing, then resets its schema.
 * 2. Runs `prisma migrate deploy` from scratch — this doubles as a regression
 *    gate for schema/migration drift (drift makes deploy or seed fail).
 * 3. Seeds the database.
 * 4. Spawns the compiled API (node dist/main.js) on a dedicated port.
 */
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import {
  API_URL,
  databaseNameOf,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  REDIS_URL,
  SUPER_ADMIN_EMAIL,
  TEST_API_PORT,
  TEST_DATABASE_URL,
} from "./config";
import { seedIntegrationFixtures } from "./fixtures";

const API_ROOT = path.resolve(__dirname, "..", "..");

let apiProcess: ChildProcess | undefined;
let apiOutput = "";

export async function setup() {
  const dbName = databaseNameOf(TEST_DATABASE_URL);
  if (!dbName.includes("test")) {
    throw new Error(`Refusing to reset non-test database "${dbName}"`);
  }

  await ensureDatabaseExists(dbName);
  await resetSchema();

  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: "test" };
  execSync("npx prisma migrate deploy", { cwd: API_ROOT, env, stdio: "inherit" });
  execSync("npx prisma db seed", { cwd: API_ROOT, env, stdio: "inherit" });

  await seedIntegrationFixtures();
  await prepareFixtures();
  await startApi();
}

export async function teardown() {
  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill("SIGTERM");
  }
}

async function ensureDatabaseExists(dbName: string) {
  const maintenanceUrl = new URL(TEST_DATABASE_URL);
  maintenanceUrl.pathname = "/postgres";
  const client = new PrismaClient({ datasourceUrl: maintenanceUrl.toString() });

  try {
    await client.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } catch (error) {
    if (!String(error).includes("already exists")) throw error;
  } finally {
    await client.$disconnect();
  }
}

async function resetSchema() {
  const client = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
  try {
    await client.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await client.$executeRawUnsafe("CREATE SCHEMA public");
  } finally {
    await client.$disconnect();
  }
}

/** The seeded super-admin is forced to rotate its password; unblock it for API fixtures. */
async function prepareFixtures() {
  const client = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
  try {
    await client.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: { forceChangePassword: false },
    });
  } finally {
    await client.$disconnect();
  }
}

async function startApi() {
  const entrypoint = path.join(API_ROOT, "dist", "main.js");
  if (!existsSync(entrypoint)) {
    throw new Error(`API build not found at ${entrypoint}. Run "pnpm --filter @nexsmsid/api build" first.`);
  }

  apiProcess = spawn("node", [entrypoint], {
    cwd: API_ROOT,
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      REDIS_URL,
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
      JWT_ACCESS_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
      API_PORT: String(TEST_API_PORT),
      API_PREFIX: "api/v1",
      WEB_ORIGIN: "http://localhost:3000",
      RATE_LIMIT_TTL: "60",
      // Keep the global limiter out of the way; route-level @Throttle decorators still apply
      RATE_LIMIT_LIMIT: "100000",
      STORAGE_PATH: "/tmp/nexsmsid-itest/storage",
      REPORT_STORAGE_PATH: "/tmp/nexsmsid-itest/storage/reports",
      LOG_LEVEL: "error",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  apiProcess.stdout?.on("data", (chunk) => (apiOutput += chunk.toString()));
  apiProcess.stderr?.on("data", (chunk) => (apiOutput += chunk.toString()));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) break;
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API did not become healthy on ${API_URL}. Output:\n${apiOutput}`);
}
