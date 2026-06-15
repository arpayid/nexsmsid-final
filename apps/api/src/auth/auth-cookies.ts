import type { CookieOptions, Response } from "express";

export const AUTH_ACCESS_COOKIE = "nexsmsid.accessToken";
export const AUTH_REFRESH_COOKIE = "nexsmsid.refreshToken";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function baseCookieOptions(nodeEnv: string): Pick<CookieOptions, "httpOnly" | "secure" | "sameSite" | "path"> {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookies(res: Response, tokens: AuthTokenPair, refreshMaxAgeSeconds: number, nodeEnv: string) {
  const base = baseCookieOptions(nodeEnv);
  res.cookie(AUTH_ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: tokens.expiresIn * 1000 });
  res.cookie(AUTH_REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: refreshMaxAgeSeconds * 1000 });
}

export function clearAuthCookies(res: Response, nodeEnv: string) {
  const base = baseCookieOptions(nodeEnv);
  res.clearCookie(AUTH_ACCESS_COOKIE, base);
  res.clearCookie(AUTH_REFRESH_COOKIE, base);
}

/** Strip JWTs from JSON responses in non-test environments (browser clients use httpOnly cookies). */
export function sanitizeAuthPayload<T extends AuthTokenPair & { user: unknown; tokenType?: string }>(
  payload: T,
  nodeEnv: string,
): Omit<T, "accessToken" | "refreshToken"> | T {
  if (nodeEnv === "test") return payload;
  const { accessToken: _accessToken, refreshToken: _refreshToken, ...safe } = payload;
  return safe;
}

export function readRefreshTokenFromRequest(cookies: Record<string, string | undefined>, body?: { refreshToken?: string }) {
  return cookies[AUTH_REFRESH_COOKIE] ?? body?.refreshToken ?? null;
}

export function readAccessTokenFromRequest(cookies: Record<string, string | undefined>, authorization?: string | string[]) {
  const cookieToken = cookies[AUTH_ACCESS_COOKIE];
  if (cookieToken) return cookieToken;

  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (value?.startsWith("Bearer ")) {
    return value.slice("Bearer ".length).trim();
  }

  return null;
}
