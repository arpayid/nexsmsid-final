import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { assertActorHasPermissions } from "../auth/permission-authorization";
import { PasswordService } from "../auth/password.service";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { createUserSchema, forceChangePasswordSchema, resetPasswordSchema, updateUserSchema } from "./users.dto";

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async list() {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      items: items.map((user) => this.serializeUser(user)),
      total,
    };
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createUserSchema, input);
    const roleIds = await this.resolveRoleIds(data.roleIds, data.roleSlugs);
    await this.assertCanAssignRoles(actor, roleIds);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          name: data.name,
          passwordHash: await this.passwordService.hash(data.password),
          status: data.status,
          roles: {
            createMany: {
              data: roleIds.map((roleId) => ({ roleId })),
              skipDuplicates: true,
            },
          },
        },
        include: { roles: { include: { role: true } } },
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "users.create",
        entity: "user",
        entityId: user.id,
        metadata: { email: user.email, roleIds },
      });

      return this.serializeUser(user);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.serializeUser(user);
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(updateUserSchema, input);
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    // Resolve and authorize role changes up-front so we never persist a partial update.
    let resolvedRoleIds: string[] | null = null;
    if (data.roleIds !== undefined || data.roleSlugs !== undefined) {
      resolvedRoleIds = await this.resolveRoleIds(data.roleIds, data.roleSlugs);
      await this.assertCanAssignRoles(actor, resolvedRoleIds);
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password !== undefined) updateData.passwordHash = await this.passwordService.hash(data.password);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: { roles: { include: { role: true } } },
      });

      if (resolvedRoleIds !== null) {
        await this.replaceUserRoles(id, resolvedRoleIds);
      }

      const updatedUser = await this.prisma.user.findUniqueOrThrow({
        where: { id },
        include: { roles: { include: { role: true } } },
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "users.update",
        entity: "user",
        entityId: id,
        metadata: { email: user.email },
      });

      return this.serializeUser(updatedUser);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    if (id === actor.id) {
      throw new BadRequestException("You cannot delete your own account");
    }

    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "INACTIVE",
        refreshTokens: {
          updateMany: {
            where: { revokedAt: null },
            data: { revokedAt: new Date() },
          },
        },
      },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "users.delete",
      entity: "user",
      entityId: id,
      metadata: { email: existing.email },
    });

    return { id, deleted: true };
  }

  async resetPassword(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(resetPasswordSchema, input);
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const hashedPassword = await this.passwordService.hash(data.newPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        forceChangePassword: data.forceChangePassword ?? false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    // Revoke tokens so the user is forced to log in again with new password
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "users.reset_password",
      entity: "user",
      entityId: id,
      metadata: { email: existing.email },
    });

    return { success: true };
  }

  async unlockUser(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "users.unlock",
      entity: "user",
      entityId: id,
      metadata: { email: existing.email },
    });

    return { success: true };
  }

  async forceChangePassword(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(forceChangePasswordSchema, input);
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        forceChangePassword: data.forceChangePassword,
      },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "users.force_change_password",
      entity: "user",
      entityId: id,
      metadata: { email: existing.email, force: data.forceChangePassword },
    });

    return { success: true };
  }

  private async resolveRoleIds(roleIds: string[] = [], roleSlugs: string[] = []) {
    const uniqueIds = new Set(roleIds);

    if (roleSlugs.length) {
      const roles = await this.prisma.role.findMany({ where: { slug: { in: roleSlugs }, isActive: true } });

      if (roles.length !== new Set(roleSlugs).size) {
        throw new BadRequestException("One or more role slugs are invalid");
      }

      for (const role of roles) {
        uniqueIds.add(role.id);
      }
    }

    if (uniqueIds.size) {
      const roles = await this.prisma.role.findMany({ where: { id: { in: [...uniqueIds] }, isActive: true } });

      if (roles.length !== uniqueIds.size) {
        throw new BadRequestException("One or more role ids are invalid");
      }
    }

    return [...uniqueIds];
  }

  /**
   * Privilege-escalation guard: an actor may only grant roles whose permission set is a
   * subset of their own. This prevents e.g. an `admin-sekolah` from assigning `super-admin`
   * (or any role with permissions the actor lacks) to themselves or anyone else.
   */
  private async assertCanAssignRoles(actor: AuthenticatedUser, roleIds: string[]) {
    if (!roleIds.length) {
      return;
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      include: { permissions: { include: { permission: true } } },
    });

    for (const role of roles) {
      const permissionKeys = role.permissions.map(({ permission }) => permission.key);
      assertActorHasPermissions(actor, permissionKeys, `assigning role "${role.slug}"`);
    }
  }

  private async replaceUserRoles(userId: string, roleIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
        skipDuplicates: true,
      }),
    ]);
  }

  private serializeUser(user: UserWithRoles) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      lockedUntil: user.lockedUntil,
      failedLoginCount: user.failedLoginCount,
      forceChangePassword: user.forceChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(({ role }) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
      })),
    };
  }

  private handleUniqueError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("User email or username already exists");
    }
  }
}
