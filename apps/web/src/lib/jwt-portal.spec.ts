import { describe, expect, it } from "vitest";

import { decodePortalFromAccessToken } from "./jwt-portal";

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("decodePortalFromAccessToken", () => {
  it("returns null for malformed tokens", () => {
    expect(decodePortalFromAccessToken("not-a-jwt")).toBeNull();
    expect(decodePortalFromAccessToken("a.b")).toBeNull();
  });

  it("returns null when portal claim is missing or invalid", () => {
    expect(decodePortalFromAccessToken(makeToken({ sub: "user-1" }))).toBeNull();
    expect(decodePortalFromAccessToken(makeToken({ portal: "unknown" }))).toBeNull();
  });

  it("returns the portal claim for valid access tokens", () => {
    expect(decodePortalFromAccessToken(makeToken({ portal: "admin" }))).toBe("admin");
    expect(decodePortalFromAccessToken(makeToken({ portal: "teacher" }))).toBe("teacher");
    expect(decodePortalFromAccessToken(makeToken({ portal: "student" }))).toBe("student");
    expect(decodePortalFromAccessToken(makeToken({ portal: "guardian" }))).toBe("guardian");
    expect(decodePortalFromAccessToken(makeToken({ portal: "unassigned" }))).toBe("unassigned");
  });
});
