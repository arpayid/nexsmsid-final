import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";

import { API_PREFIX, API_URL, JWT_ACCESS_SECRET, SUPER_ADMIN_EMAIL, TEST_API_PORT, TEST_DATABASE_URL } from "./config";

/** Direct database access for fixtures and assertions. */
export const db = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });

/** Cloudflare Turnstile dummy token (works with test secret key in CI). */
export const TEST_CAPTCHA_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

export type HttpResult = { status: number; body: any };

export async function http(method: string, path: string, opts: { token?: string; body?: unknown } = {}): Promise<HttpResult> {
  const url = path.startsWith("http") ? path : `${API_URL}/${API_PREFIX}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response (e.g. file download)
  }
  return { status: res.status, body };
}

export const get = (path: string, token?: string) => http("GET", path, { token });
export const post = (path: string, body?: unknown, token?: string) => http("POST", path, { body: body ?? {}, token });

export async function postMultipart(path: string, formData: FormData): Promise<HttpResult> {
  const url = path.startsWith("http") ? path : `${API_URL}/${API_PREFIX}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, { method: "POST", body: formData });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }
  return { status: res.status, body };
}

export async function fetchStaticUpload(path: string): Promise<number> {
  const url = path.startsWith("http") ? path : `http://127.0.0.1:${TEST_API_PORT}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url);
  return res.status;
}
export const patch = (path: string, body?: unknown, token?: string) => http("PATCH", path, { body: body ?? {}, token });

const jwtService = new JwtService({});

/**
 * Mints a valid access token directly (same secret as the spawned server).
 * Used so fixture setup does not consume the login endpoint's strict rate limit;
 * real login flows are covered explicitly in auth.spec.ts.
 */
export async function mintAccessToken(email: string): Promise<string> {
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  return jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      type: "access",
      ...(user.passwordChangedAt ? { passwordChangedAt: user.passwordChangedAt.toISOString() } : {}),
    },
    { secret: JWT_ACCESS_SECRET, expiresIn: "15m" },
  );
}

export const adminToken = () => mintAccessToken(SUPER_ADMIN_EMAIL);

/** Finds the first seeded user holding the given role slug. */
export async function findUserByRole(slug: string) {
  const userRole = await db.userRole.findFirst({
    where: { role: { slug } },
    include: { user: true },
    orderBy: { userId: "asc" },
  });
  if (!userRole) throw new Error(`No seeded user found with role "${slug}"`);
  return userRole.user;
}
