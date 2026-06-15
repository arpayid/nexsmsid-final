import { describe, expect, it } from "vitest";

import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  readAccessTokenFromRequest,
  readRefreshTokenFromRequest,
  sanitizeAuthPayload,
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
});
