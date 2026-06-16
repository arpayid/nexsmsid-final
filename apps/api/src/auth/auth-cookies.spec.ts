import { describe, expect, it } from "vitest";

import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  clearAuthCookies,
  readAccessTokenFromRequest,
  readRefreshTokenFromRequest,
  sanitizeAuthPayload,
  setAuthCookies,
} from "./auth-cookies";

describe("auth-cookies", () => {
  it("prefers the access cookie over the Authorization header", () => {
    const token = readAccessTokenFromRequest({ [AUTH_ACCESS_COOKIE]: "cookie-token" }, "Bearer header-token");
    expect(token).toBe("cookie-token");
  });

  it("falls back to the Authorization header when no cookie is present", () => {
    const token = readAccessTokenFromRequest({}, "Bearer header-token");
    expect(token).toBe("header-token");
  });

  it("reads refresh token from cookie or body", () => {
    expect(readRefreshTokenFromRequest({ [AUTH_REFRESH_COOKIE]: "cookie" }, { refreshToken: "body" })).toBe("cookie");
    expect(readRefreshTokenFromRequest({}, { refreshToken: "body" })).toBe("body");
  });

  it("strips JWTs from auth payloads outside test mode", () => {
    const payload = {
      user: { id: "1" },
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 900,
      tokenType: "Bearer" as const,
    };
    expect(sanitizeAuthPayload(payload, "production")).toEqual({
      user: { id: "1" },
      expiresIn: 900,
      tokenType: "Bearer",
    });
    expect(sanitizeAuthPayload(payload, "test")).toEqual(payload);
  });

  it("sets Secure cookies only for HTTPS WEB_ORIGIN", () => {
    const res = {
      cookies: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
      cookie(name: string, value: string, options: Record<string, unknown>) {
        this.cookies.push({ name, value, options });
      },
    };

    setAuthCookies(
      res as never,
      { accessToken: "a", refreshToken: "r", expiresIn: 900 },
      3600,
      "production",
      "http://156.67.216.146",
    );

    expect(res.cookies[0]?.options.secure).toBe(false);

    res.cookies = [];
    setAuthCookies(
      res as never,
      { accessToken: "a", refreshToken: "r", expiresIn: 900 },
      3600,
      "production",
      "https://nexsmsid.dev",
    );

    expect(res.cookies[0]?.options.secure).toBe(true);
  });
});
