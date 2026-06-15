import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { RolesService } from "./roles.service";

const mockPrisma = {
  role: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  permission: {
    findMany: vi.fn(),
  },
  rolePermission: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockAuditService = { record: vi.fn() };

const adminSekolahPermissions = [
  "dashboard.view",
  "users.view",
  "users.create",
  "users.update",
  "roles.view",
  "roles.create",
  "roles.update",
];

const adminSekolahActor = {
  id: "admin-sekolah-user",
  email: "admin@school.dev",
  name: "Admin Sekolah",
  roles: ["admin-sekolah"],
  permissions: adminSekolahPermissions,
};

const superAdminActor = {
  id: "super-admin-user",
  email: "superadmin@nexsmsid.dev",
  name: "Super Admin",
  roles: ["super-admin"],
  permissions: ["*"],
};

const mockMeta = { ipAddress: "127.0.0.1", userAgent: "test-agent" };

describe("RolesService", () => {
  let service: RolesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RolesService(mockAuditService as any, mockPrisma as any);
  });

  describe("create", () => {
    it("allows admin-sekolah to create a role with permissions they have", async () => {
      mockPrisma.permission.findMany.mockResolvedValue([
        { id: "perm-1", key: "users.view" },
        { id: "perm-2", key: "users.create" },
      ]);
      mockPrisma.role.create.mockResolvedValue({
        id: "role-new",
        name: "Custom Role",
        slug: "custom-role",
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
          { permission: { id: "perm-1", key: "users.view", name: "View Users", group: "users" } },
          { permission: { id: "perm-2", key: "users.create", name: "Create Users", group: "users" } },
        ],
      });

      const result = await service.create(
        {
          name: "Custom Role",
          slug: "custom-role",
          permissionKeys: ["users.view", "users.create"],
        },
        adminSekolahActor,
        mockMeta,
      );

      expect(result.slug).toBe("custom-role");
      expect(mockPrisma.role.create).toHaveBeenCalled();
      expect(mockAuditService.record).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("blocks admin-sekolah from adding users.delete permission to a role", async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        id: "role-custom",
        slug: "custom-role",
        name: "Custom Role",
      });

      await expect(
        service.update("role-custom", { permissionKeys: ["users.view", "users.delete"] }, adminSekolahActor, mockMeta),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.role.update).not.toHaveBeenCalled();
    });

    it("blocks updates to super-admin role permissions", async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        id: "role-super-admin",
        slug: "super-admin",
        name: "Super Admin",
      });

      await expect(
        service.update("role-super-admin", { permissionKeys: ["users.view", "users.create"] }, superAdminActor, mockMeta),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.role.update).not.toHaveBeenCalled();
    });

    it("allows super-admin to update a normal role", async () => {
      const existingRole = {
        id: "role-custom",
        slug: "custom-role",
        name: "Custom Role",
      };

      mockPrisma.role.findUnique.mockResolvedValue(existingRole);
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        ...existingRole,
        name: "Updated Role",
        description: "Updated description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [{ permission: { id: "perm-1", key: "users.view", name: "View Users", group: "users" } }],
      });
      mockPrisma.permission.findMany.mockResolvedValue([{ id: "perm-1", key: "users.view" }]);
      mockPrisma.role.update.mockResolvedValue(existingRole);
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.update(
        "role-custom",
        {
          name: "Updated Role",
          description: "Updated description",
          permissionKeys: ["users.view"],
        },
        superAdminActor,
        mockMeta,
      );

      expect(result.name).toBe("Updated Role");
      expect(mockPrisma.role.update).toHaveBeenCalled();
      expect(mockAuditService.record).toHaveBeenCalled();
    });

    it("throws NotFoundException for unknown role id", async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.update("missing-role", { name: "Updated" }, superAdminActor, mockMeta)).rejects.toThrow(NotFoundException);
    });
  });
});
