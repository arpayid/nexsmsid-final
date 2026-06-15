import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PermissionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
      this.prisma.permission.count(),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });

    if (!permission) {
      throw new NotFoundException("Permission not found");
    }

    return permission;
  }
}
