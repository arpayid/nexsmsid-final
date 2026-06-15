import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { assertActorHasPermissions, assertCanModifyRole } from "../auth/permission-authorization";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { roleSchema, updateRoleSchema } from "./roles.dto";

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

@Injectable()
export class RolesService {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async list() {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.role.count(),
    ]);

    return {
      items: items.map((role) => this.serializeRole(role)),
      total,
    };
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(roleSchema, input);
    assertActorHasPermissions(actor, data.permissionKeys ?? [], "creating role");
    const permissionIds = await this.resolvePermissionIds(data.permissionKeys ?? []);

    try {
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          isActive: data.isActive,
          permissions: {
            createMany: {
              data: permissionIds.map((permissionId) => ({ permissionId })),
              skipDuplicates: true,
            },
          },
        },
        include: { permissions: { include: { permission: true } } },
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "roles.create",
        entity: "role",
        entityId: role.id,
        metadata: { slug: role.slug, permissionKeys: data.permissionKeys ?? [] },
      });

      return this.serializeRole(role);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return this.serializeRole(role);
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(updateRoleSchema, input);
    const existing = await this.prisma.role.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Role not found");
    }

    assertCanModifyRole(actor, existing.slug, {
      slug: data.slug,
      isActive: data.isActive,
      permissionKeys: data.permissionKeys,
    });

    if (data.permissionKeys !== undefined) {
      assertActorHasPermissions(actor, data.permissionKeys, "updating role permissions");
    }

    const updateData: Prisma.RoleUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    try {
      await this.prisma.role.update({ where: { id }, data: updateData });

      if (data.permissionKeys !== undefined) {
        const permissionIds = await this.resolvePermissionIds(data.permissionKeys);
        await this.replaceRolePermissions(id, permissionIds);
      }

      const role = await this.prisma.role.findUniqueOrThrow({
        where: { id },
        include: { permissions: { include: { permission: true } } },
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "roles.update",
        entity: "role",
        entityId: id,
        metadata: { slug: role.slug },
      });

      return this.serializeRole(role);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.prisma.role.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Role not found");
    }

    if (existing.slug === "super-admin") {
      throw new BadRequestException("Super Admin role cannot be deleted");
    }

    await this.prisma.role.delete({ where: { id } });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "roles.delete",
      entity: "role",
      entityId: id,
      metadata: { slug: existing.slug },
    });

    return { id, deleted: true };
  }

  private async resolvePermissionIds(permissionKeys: string[]) {
    const uniqueKeys = [...new Set(permissionKeys)];

    if (!uniqueKeys.length) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({ where: { key: { in: uniqueKeys } } });

    if (permissions.length !== uniqueKeys.length) {
      throw new BadRequestException("One or more permission keys are invalid");
    }

    return permissions.map((permission) => permission.id);
  }

  private async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);
  }

  private serializeRole(role: RoleWithPermissions) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(({ permission }) => ({
        id: permission.id,
        key: permission.key,
        name: permission.name,
        group: permission.group,
      })),
    };
  }

  private handleUniqueError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("Role slug already exists");
    }
  }
}
