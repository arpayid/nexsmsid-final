import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { ALLOW_AUTHENTICATED_KEY } from "../decorators/allow-authenticated.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { REQUIRED_PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { PermissionGuard } from "./permission.guard";

describe("PermissionGuard", () => {
  let guard: PermissionGuard;
  let mockReflector: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new PermissionGuard(mockReflector);
  });

  function createContext(permissions: string[] = []) {
    const user = permissions.length ? { permissions } : undefined;
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  function mockMetadata(options: { isPublic?: boolean; allowAuthenticated?: boolean; requiredPermissions?: string[] }) {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) {
        return options.isPublic ?? false;
      }
      if (key === ALLOW_AUTHENTICATED_KEY) {
        return options.allowAuthenticated ?? false;
      }
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return options.requiredPermissions;
      }
      return undefined;
    });
  }

  it("should allow access for public routes", () => {
    mockMetadata({ isPublic: true });
    const ctx = createContext([]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should allow access when AllowAuthenticated and user is logged in", () => {
    mockMetadata({ allowAuthenticated: true });
    const ctx = createContext(["users.view"]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should throw ForbiddenException when AllowAuthenticated but no user in request", () => {
    mockMetadata({ allowAuthenticated: true });
    const ctx = createContext([]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException when no permissions, not AllowAuthenticated, and not public", () => {
    mockMetadata({});
    const ctx = createContext(["users.view"]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow("This endpoint requires explicit permissions");
  });

  it("should allow access when user has required permission", () => {
    mockMetadata({ requiredPermissions: ["users.view"] });
    const ctx = createContext(["users.view", "users.create"]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should deny access when user lacks required permission", () => {
    mockMetadata({ requiredPermissions: ["admin.access"] });
    const ctx = createContext(["users.view"]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException when no user in request", () => {
    mockMetadata({ requiredPermissions: ["users.view"] });
    const ctx = createContext([]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("should allow wildcard permission *", () => {
    mockMetadata({ requiredPermissions: ["users.view", "users.create"] });
    const ctx = createContext(["*"]);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
