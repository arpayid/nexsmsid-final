import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { exportHistoryListQuerySchema } from "./export-history.dto";

@Injectable()
export class ExportHistoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(query: unknown) {
    const params = parseWithSchema(exportHistoryListQuerySchema, query);
    const where: Prisma.ExportHistoryWhereInput = {};
    if (params.entity) where.entity = params.entity;
    if (params.format) where.format = params.format as never;
    if (params.search) {
      where.OR = [
        { entity: { contains: params.search, mode: "insensitive" } },
        { fileName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.exportHistory.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: this.includeRelations(),
      }),
      this.prisma.exportHistory.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.exportHistory.findUnique({ where: { id }, include: this.includeRelations() });
    if (!item) throw new NotFoundException("Export history not found");
    return item;
  }

  private includeRelations() {
    return {
      reportJob: true,
      requestedBy: { select: { id: true, email: true, name: true } },
    };
  }
}
