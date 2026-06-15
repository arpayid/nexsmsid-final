import { Inject, Injectable } from "@nestjs/common";

import { AuthenticatedUser } from "../../../auth/auth.types";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class SessionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(userId: string, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
      }),
      this.prisma.refreshToken.count({ where: { userId, revokedAt: null } }),
    ]);

    return { items, total, page, limit };
  }

  async revoke(sessionId: string, userId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (!session) {
      return null;
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { id: sessionId, revokedAt: new Date() };
  }

  async revokeAll(userId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { revokedCount: result.count };
  }
}
