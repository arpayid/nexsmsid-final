import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";

const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  loginHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const mockJwtService = {
  signAsync: vi.fn(),
  verifyAsync: vi.fn(),
};

const mockConfigService = {
  getOrThrow: vi.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_ACCESS_SECRET: "test-access-secret-min-64-chars-123456789012345678901234567890",
      JWT_REFRESH_SECRET: "test-refresh-secret-min-64-chars-123456789012345678901234567890",
      JWT_ACCESS_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
    };
    return config[key];
  }),
};

const mockAuditService = {
  record: vi.fn(),
};

describe("AuthService", () => {
  let service: AuthService;
  const passwordService = new PasswordService();

  const mockMeta = { ipAddress: "127.0.0.1", userAgent: "test-agent" };

  const mockUser = {
    id: "cmq8a2vlk007el09nsov1simp",
    email: "superadmin@nexsmsid.dev",
    name: "Super Admin",
    passwordHash: "",
    status: "ACTIVE",
    forceChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
    passwordChangedAt: new Date(),
    deletedAt: null,
    roles: [
      {
        role: {
          isActive: true,
          slug: "super-admin",
          permissions: [{ permission: { key: "users.view" } }],
        },
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser.passwordHash = await passwordService.hash("TestPassword123!");

    service = new AuthService(mockAuditService as any, mockConfigService as any, mockJwtService as any, passwordService, mockPrisma as any);
  });

  describe("login", () => {
    it("should succeed with valid credentials", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue("mock-token");

      const result = await service.login({ email: "superadmin@nexsmsid.dev", password: "TestPassword123!" }, mockMeta);

      expect(result.accessToken).toBe("mock-token");
      expect(result.refreshToken).toBe("mock-token");
      expect(result.user.email).toBe("superadmin@nexsmsid.dev");
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          portal: "admin",
        }),
        expect.any(Object),
      );
    });

    it("should throw UnauthorizedException for wrong password", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ failedLoginCount: 1 });

      await expect(service.login({ email: "superadmin@nexsmsid.dev", password: "wrong" }, mockMeta)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for unknown email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login({ email: "unknown@email.com", password: "TestPassword123!" }, mockMeta)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should lock account after 5 failed attempts", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, failedLoginCount: 4 });
      mockPrisma.user.update
        .mockResolvedValueOnce({ failedLoginCount: 5 })
        .mockResolvedValueOnce({ ...mockUser, failedLoginCount: 5, lockedUntil: new Date() });

      await expect(service.login({ email: "superadmin@nexsmsid.dev", password: "wrong" }, mockMeta)).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginCount: { increment: 1 } },
          select: { failedLoginCount: true },
        }),
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
        }),
      );
    });

    it("should throw ForbiddenException for locked account", async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 3600000),
      };
      mockPrisma.user.findFirst.mockResolvedValue(lockedUser);

      await expect(service.login({ email: "superadmin@nexsmsid.dev", password: "TestPassword123!" }, mockMeta)).rejects.toThrow(
        new ForbiddenException("Account is locked. Try again later."),
      );
    });

    it("should validate email format (lowercase transform)", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue("mock-token");

      await service.login({ email: "SUPERADMIN@nexsmsid.dev", password: "TestPassword123!" }, mockMeta);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ email: "superadmin@nexsmsid.dev" }),
        }),
      );
    });
  });

  describe("refresh", () => {
    const mockRefreshTokenRecord = {
      id: "token-id",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      tokenHash: "",
      user: { ...mockUser },
    };

    beforeEach(async () => {
      mockRefreshTokenRecord.tokenHash = await passwordService.hash("valid-refresh-token");
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockJwtService.verifyAsync.mockResolvedValue({ jti: "token-id", type: "refresh" });
    });

    it("should succeed with valid refresh token", async () => {
      mockJwtService.signAsync.mockResolvedValue("new-access-token");
      const result = await service.refresh({ refreshToken: "valid-refresh-token" }, mockMeta);

      expect(result.accessToken).toBe("new-access-token");
    });

    it("should detect refresh token reuse and revoke all sessions", async () => {
      // Simulates a replay race: the token was already revoked by a concurrent refresh
      mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 3 });

      await expect(service.refresh({ refreshToken: "valid-refresh-token" }, mockMeta)).rejects.toThrow(UnauthorizedException);

      // Second updateMany call revokes the whole session family for the user
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revokedAt: null }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it("should throw UnauthorizedException for revoked token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        revokedAt: new Date(),
      });

      await expect(service.refresh({ refreshToken: "revoked-token" }, mockMeta)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for expired token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(service.refresh({ refreshToken: "expired-token" }, mockMeta)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("changePassword", () => {
    it("should succeed with valid current password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.changePassword(
        { id: mockUser.id, email: mockUser.email, name: mockUser.name, roles: [], permissions: [] },
        { currentPassword: "TestPassword123!", newPassword: "NewPass1234!", confirmPassword: "NewPass1234!" },
        mockMeta,
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("should throw BadRequestException for wrong current password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.changePassword(
          { id: mockUser.id, email: mockUser.email, name: mockUser.name, roles: [], permissions: [] },
          { currentPassword: "wrong", newPassword: "NewPass1234!", confirmPassword: "NewPass1234!" },
          mockMeta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject same as old password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.changePassword(
          { id: mockUser.id, email: mockUser.email, name: mockUser.name, roles: [], permissions: [] },
          { currentPassword: "TestPassword123!", newPassword: "TestPassword123!", confirmPassword: "TestPassword123!" },
          mockMeta,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("me", () => {
    it("should return the authenticated user", async () => {
      const authUser = { id: "1", email: "test@test.com", name: "Test", roles: [], permissions: [] };
      const result = await service.me(authUser);
      expect(result).toEqual(authUser);
    });
  });

  describe("getLoginHistory", () => {
    const authUser = { id: mockUser.id, email: mockUser.email, name: mockUser.name, roles: [], permissions: [] };

    beforeEach(() => {
      mockPrisma.loginHistory.findMany.mockResolvedValue([]);
      mockPrisma.loginHistory.count.mockResolvedValue(0);
    });

    it("should cap limit to 100", async () => {
      await service.getLoginHistory(authUser, { page: 1, limit: 500 });

      expect(mockPrisma.loginHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should use default limit of 10", async () => {
      await service.getLoginHistory(authUser, { page: 1 });

      expect(mockPrisma.loginHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });
});
