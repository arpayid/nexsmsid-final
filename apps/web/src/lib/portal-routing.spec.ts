import { describe, expect, it } from "vitest";

import type { AuthUser } from "@nexsmsid/api-client";

import { portalHomePath, resolvePortalForUser } from "./portal-routing";

function makeUser(roles: string[]): AuthUser {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    roles,
    permissions: [],
  };
}

describe("resolvePortalForUser", () => {
  it("returns unassigned when user is null", () => {
    expect(resolvePortalForUser(null)).toBe("unassigned");
  });

  it("returns unassigned when user is undefined", () => {
    expect(resolvePortalForUser(undefined)).toBe("unassigned");
  });

  it("returns unassigned when user has no roles", () => {
    expect(resolvePortalForUser(makeUser([]))).toBe("unassigned");
  });

  it("returns unassigned for unrecognized roles", () => {
    expect(resolvePortalForUser(makeUser(["unknown-role", "guest"]))).toBe("unassigned");
  });

  it("returns admin for admin role keywords", () => {
    expect(resolvePortalForUser(makeUser(["super-admin"]))).toBe("admin");
  });

  it("returns teacher for guru role", () => {
    expect(resolvePortalForUser(makeUser(["guru"]))).toBe("teacher");
  });

  it("returns student for siswa role", () => {
    expect(resolvePortalForUser(makeUser(["siswa"]))).toBe("student");
  });

  it("returns guardian for orang-tua-wali role", () => {
    expect(resolvePortalForUser(makeUser(["orang-tua-wali"]))).toBe("guardian");
  });
});

describe("portalHomePath", () => {
  it("maps unassigned portal to /account/unassigned", () => {
    expect(portalHomePath("unassigned")).toBe("/account/unassigned");
  });
});
