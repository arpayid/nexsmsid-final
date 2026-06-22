import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import type { Response } from "express";

const mockAuthService = {
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  changePassword: vi.fn(),
  getLoginHistory: vi.fn(),
  me: vi.fn(),
};

const mockAuthCookieService = {
  attachAuthCookies: vi.fn(),
  sanitizeAuthResponse: vi.fn((x: any) => x),
  clearAuthCookies: vi.fn(),
};

const mockRes = {
  cookie: vi.fn(),
  clearCookie: vi.fn(),
} as unknown as Response;

function mockReq(overrides?: Record<string, unknown>) {
  return {
    headers: { "user-agent": "test-agent", "x-forwarded-for": "127.0.0.1" },
    cookies: {},
    ip: "127.0.0.1",
    ...overrides,
  } as any;
}

describe("AuthController", () => {
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(mockAuthService as any, mockAuthCookieService as any);
  });

  describe("login", () => {
    it("should call authService.login and set cookies", async () => {
      const tokens = { accessToken: "at", refreshToken: "rt", expiresIn: 900, user: { id: "1" } };
      mockAuthService.login.mockResolvedValue(tokens);
      mockAuthCookieService.sanitizeAuthResponse.mockReturnValue(tokens);

      const body = { email: "test@test.com", password: "pass123" };
      const req = mockReq();
      const result = await controller.login(body, req, mockRes);

      expect(mockAuthService.login).toHaveBeenCalledWith(body, expect.objectContaining({ ipAddress: "127.0.0.1" }));
      expect(mockAuthCookieService.attachAuthCookies).toHaveBeenCalledWith(mockRes, tokens);
      expect(result).toHaveProperty("success", true);
    });

    it("should propagate auth errors", async () => {
      mockAuthService.login.mockRejectedValue(new BadRequestException("Invalid credentials"));
      const body = { email: "bad@test.com", password: "wrong" };
      const req = mockReq();
      await expect(controller.login(body, req, mockRes)).rejects.toThrow(BadRequestException);
    });
  });

  describe("refresh", () => {
    it("should call authService.refresh with cookie token", async () => {
      const tokens = { accessToken: "at2", refreshToken: "rt2", expiresIn: 900, user: { id: "1" } };
      mockAuthService.refresh.mockResolvedValue(tokens);
      mockAuthCookieService.sanitizeAuthResponse.mockReturnValue(tokens);

      const req = mockReq({ cookies: { "nexsmsid.refreshToken": "rt-old" } });
      const result = await controller.refresh({}, req, mockRes);

      expect(mockAuthService.refresh).toHaveBeenCalledWith({ refreshToken: "rt-old" }, expect.any(Object));
      expect(result).toHaveProperty("success", true);
    });

    it("should return unauthorized when no refresh token", async () => {
      const req = mockReq({ cookies: {} });
      await expect(controller.refresh({}, req, mockRes)).rejects.toThrow(BadRequestException);
    });
  });

  describe("logout", () => {
    it("should call authService.logout and clear cookies", async () => {
      mockAuthService.logout.mockResolvedValue({ revokedRefreshTokens: 1 });
      const user = { id: "1" } as any;
      const req = mockReq({ cookies: { "nexsmsid.refreshToken": "rt" } });
      const result = await controller.logout(user, {}, req, mockRes);
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockAuthCookieService.clearAuthCookies).toHaveBeenCalled();
      expect(result).toHaveProperty("success", true);
    });
  });

  describe("me", () => {
    it("should return current user profile", async () => {
      const user = { id: "1", name: "Test", email: "test@test.com" };
      mockAuthService.me.mockResolvedValue(user);
      const result = await controller.me(user as any);
      expect(result).toHaveProperty("data");
      expect(result.data).toEqual(user);
    });
  });

  describe("getLoginHistory", () => {
    it("should call authService.getLoginHistory and return result", async () => {
      mockAuthService.getLoginHistory.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10 } });
      const user = { id: "1" } as any;
      const result = await controller.getLoginHistory(user, { page: "1", limit: "10" });
      expect(mockAuthService.getLoginHistory).toHaveBeenCalled();
      expect(result).toHaveProperty("data");
    });
  });
});
