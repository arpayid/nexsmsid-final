import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PasswordService } from "../auth/password.service";

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockAuditService = { record: vi.fn() };
const mockPasswordService = new PasswordService();

describe("UsersService", () => {
  let service: UsersService;

  const mockUser = {
    id: "cmq1",
    email: "user@test.com",
    name: "Test User",
    passwordHash: "hash",
    status: "ACTIVE",
    forceChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
    deletedAt: null,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockAuditService as any, mockPasswordService, mockPrisma as any);
  });

  describe("list", () => {
    it("should return paginated users", async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockUser], 1]);
      const result = await service.list();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      const result = await service.findById("cmq1");
      expect(result.id).toBe("cmq1");
    });

    it("should throw NotFoundException for unknown id", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.findById("invalid")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    const input = { email: "new@test.com", name: "New User", password: "StrongPass123!" };

    it("should create a new user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, email: "new@test.com" });
      const result = await service.create(
        input,
        { id: "admin", email: "admin@test.com", name: "Admin", roles: [], permissions: [] },
        {} as any,
      );
      expect(result.email).toBe("new@test.com");
    });
  });

  describe("delete", () => {
    it("should soft-delete a user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
      const result = await service.delete("cmq1", { id: "admin", email: "a", name: "A", roles: [], permissions: [] }, {} as any);
      expect(result.deleted).toBe(true);
      expect(result.id).toBe("cmq1");
    });
  });

  describe("unlockUser", () => {
    it("should unlock a locked user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, lockedUntil: null, failedLoginCount: 0 });
      const result = await service.unlockUser("cmq1", { id: "admin", email: "a", name: "A", roles: [], permissions: [] }, {} as any);
      expect(result).toBeDefined();
    });
  });
});
