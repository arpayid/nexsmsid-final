import { randomUUID } from "node:crypto";

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Prisma } from "@prisma/client";
import { resolvePortalForUser } from "@nexsmsid/types";

import { AuditService } from "../audit/audit.service";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { changePasswordSchema, loginSchema, logoutSchema, passwordValidator, refreshSchema } from "./auth.dto";
import { AuthenticatedUser, JwtRefreshPayload, RequestMeta } from "./auth.types";
import { toAuthenticatedUser } from "./auth-user.mapper";
import { PasswordService } from "./password.service";

export { passwordValidator };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async login(input: unknown, meta: RequestMeta) {
    const credentials = parseWithSchema(loginSchema, input);
    const user = await this.findAuthUserByEmail(credentials.email);

    if (!user) {
      await this.logLoginHistory(null, credentials.email, false, "user_not_found", meta);
      await this.auditService.record({
        ...meta,
        action: "auth.login_failed",
        entity: "user",
        metadata: { email: credentials.email, reason: "user_not_found" },
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.logLoginHistory(user.id, credentials.email, false, "account_locked", meta);
      throw new ForbiddenException("Account is locked. Try again later.");
    }

    const passwordValid = await this.passwordService.verify(credentials.password, user.passwordHash);

    if (!passwordValid) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
        select: { failedLoginCount: true },
      });

      const newFailedCount = updated.failedLoginCount;
      const isLocked = newFailedCount >= 5;

      if (isLocked) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 15 * 60000) },
        });
      }

      await this.logLoginHistory(user.id, credentials.email, false, isLocked ? "account_locked_now" : "invalid_password", meta);
      await this.auditService.record({
        ...meta,
        actorId: user.id,
        action: "auth.login_failed",
        entity: "user",
        entityId: user.id,
        metadata: { email: credentials.email, reason: "invalid_password", failedCount: newFailedCount },
      });

      throw new UnauthorizedException("Invalid email or password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    const authUser = toAuthenticatedUser(user);
    const tokens = await this.createTokenPair(authUser, meta);

    await this.logLoginHistory(user.id, credentials.email, true, null, meta);
    await this.auditService.record({
      ...meta,
      actorId: user.id,
      action: "auth.login",
      entity: "user",
      entityId: user.id,
    });

    return {
      user: authUser,
      ...tokens,
    };
  }

  private async logLoginHistory(userId: string | null, email: string, success: boolean, reason: string | null, meta: RequestMeta) {
    try {
      await this.prisma.loginHistory.create({
        data: {
          userId,
          email,
          success,
          reason,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    } catch (e) {
      this.logger.warn(
        `Failed to log login history for ${email}: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  async refresh(input: unknown, meta: RequestMeta) {
    const { refreshToken } = parseWithSchema(refreshSchema, input);
    if (!refreshToken) {
      throw new BadRequestException("Missing refresh token");
    }
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt <= new Date() || storedToken.user.deletedAt) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const refreshTokenValid = await this.passwordService.verify(refreshToken, storedToken.tokenHash);

    if (
      !refreshTokenValid ||
      storedToken.user.status !== "ACTIVE" ||
      (storedToken.user.lockedUntil && storedToken.user.lockedUntil > new Date())
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Sequential reuse: a legitimate (signature-valid, hash-matching) token that was
    // already rotated is being replayed — assume theft and revoke the session family.
    if (storedToken.revokedAt) {
      await this.handleRefreshTokenReuse(storedToken.id, storedToken.userId, meta);
    }

    // Atomic single-use rotation: only one concurrent refresh can revoke the token.
    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count === 0) {
      // Concurrent replay race: another request rotated this token first
      await this.handleRefreshTokenReuse(storedToken.id, storedToken.userId, meta);
    }

    const authUser = toAuthenticatedUser(storedToken.user);
    const tokens = await this.createTokenPair(authUser, meta);

    await this.auditService.record({
      ...meta,
      actorId: authUser.id,
      action: "auth.refresh",
      entity: "refresh_token",
      entityId: storedToken.id,
    });

    return {
      user: authUser,
      ...tokens,
    };
  }

  /** Revokes all of the user's active refresh tokens, records the event, and rejects the request. */
  private async handleRefreshTokenReuse(tokenId: string, userId: string, meta: RequestMeta): Promise<never> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.auditService.record({
      ...meta,
      actorId: userId,
      action: "auth.refresh_token_reuse_detected",
      entity: "refresh_token",
      entityId: tokenId,
    });
    throw new UnauthorizedException("Invalid refresh token");
  }

  async logout(user: AuthenticatedUser, input: unknown, meta: RequestMeta) {
    const { refreshToken } = parseWithSchema(logoutSchema, input ?? {});
    const where: Prisma.RefreshTokenWhereInput = {
      userId: user.id,
      revokedAt: null,
    };

    if (refreshToken) {
      const payload = await this.verifyRefreshToken(refreshToken);
      where.id = payload.jti;
    }

    const result = await this.prisma.refreshToken.updateMany({
      where,
      data: { revokedAt: new Date() },
    });
    const revoked = result.count;

    await this.auditService.record({
      ...meta,
      actorId: user.id,
      action: "auth.logout",
      entity: "user",
      entityId: user.id,
      metadata: { revokedRefreshTokens: revoked },
    });

    return { revokedRefreshTokens: revoked };
  }

  async logoutAll(user: AuthenticatedUser, meta: RequestMeta) {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      ...meta,
      actorId: user.id,
      action: "auth.logout_all",
      entity: "user",
      entityId: user.id,
      metadata: { revokedRefreshTokens: result.count },
    });

    return { revokedRefreshTokens: result.count };
  }

  async changePassword(user: AuthenticatedUser, input: unknown, meta: RequestMeta) {
    const data = parseWithSchema(changePasswordSchema, input);

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new NotFoundException("User not found");

    const passwordValid = await this.passwordService.verify(data.currentPassword, dbUser.passwordHash);
    if (!passwordValid) {
      throw new BadRequestException("Password saat ini salah");
    }

    const isSameAsOld = await this.passwordService.verify(data.newPassword, dbUser.passwordHash);
    if (isSameAsOld) {
      throw new BadRequestException("Password baru tidak boleh sama dengan password saat ini");
    }

    const hashedPassword = await this.passwordService.hash(data.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        forceChangePassword: false,
      },
    });

    // Revoke all refresh tokens on password change
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      ...meta,
      actorId: user.id,
      action: "auth.change_password",
      entity: "user",
      entityId: user.id,
    });

    return { success: true };
  }

  async getLoginHistory(user: AuthenticatedUser, query: any) {
    const page = Number(query.page) || 1;
    const limit = Math.min(100, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.loginHistory.count({ where: { userId: user.id } }),
    ]);

    return { items, total, page, limit };
  }

  async me(user: AuthenticatedUser) {
    return user;
  }

  private async findAuthUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async createTokenPair(user: AuthenticatedUser, meta: RequestMeta) {
    const refreshTokenId = randomUUID();
    const accessTokenTtl = this.parseExpiresIn(this.configService.getOrThrow<string>("JWT_ACCESS_EXPIRES_IN"));
    const refreshTokenTtl = this.parseExpiresIn(this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN"));
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: "access",
        passwordChangedAt: user.passwordChangedAt,
        portal: resolvePortalForUser(user),
      },
      {
        expiresIn: accessTokenTtl,
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti: refreshTokenId,
        type: "refresh",
      },
      {
        expiresIn: refreshTokenTtl,
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: await this.passwordService.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenTtl * 1000),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: accessTokenTtl,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });

      if (payload.type !== "refresh" || !payload.jti) {
        throw new BadRequestException("Invalid refresh token type");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private parseExpiresIn(value: string) {
    const match = /^(\d+)([smhd])$/.exec(value);

    if (!match) {
      const seconds = Number(value);

      if (Number.isFinite(seconds) && seconds > 0) {
        return seconds;
      }

      throw new BadRequestException(`Invalid JWT expiration value: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;

    return amount * multiplier;
  }
}
