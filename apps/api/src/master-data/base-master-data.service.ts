import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
});

export type MasterDataConfig<TCreate extends z.ZodType, TUpdate extends z.ZodType> = {
  auditEntity: string;
  createSchema: TCreate;
  defaultOrderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, unknown>;
  modelName: string;
  searchableFields: string[];
  updateSchema: TUpdate;
  checkRelationsOnDelete?: string[];
};

@Injectable()
export class BaseMasterDataService<TCreate extends z.ZodType, TUpdate extends z.ZodType> {
  constructor(
    @Inject(PrismaService) protected readonly prisma: PrismaService,
    @Inject(AuditService) protected readonly auditService: AuditService,
    private readonly config: MasterDataConfig<TCreate, TUpdate>,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const delegate = this.delegate();
    const where = this.buildWhere(params.search);
    const skip = (params.page - 1) * params.limit;
    const orderBy = this.config.defaultOrderBy ?? { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take: params.limit,
        orderBy,
        ...(this.config.include ? { include: this.config.include } : {}),
      }),
      delegate.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async findById(id: string) {
    const item = await this.delegate().findFirst({
      where: { id, deletedAt: null },
      ...(this.config.include ? { include: this.config.include } : {}),
    });

    if (!item) {
      throw new NotFoundException(`${this.config.auditEntity} not found`);
    }

    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(this.config.createSchema, input);

    try {
      const item = await this.delegate().create({
        data,
        ...(this.config.include ? { include: this.config.include } : {}),
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: `${this.config.auditEntity}.create`,
        entity: this.config.auditEntity,
        entityId: String(item.id),
        metadata: this.auditMetadata(item),
      });

      return item;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(this.config.updateSchema, input);

    try {
      const item = await this.delegate().update({
        where: { id },
        data,
        ...(this.config.include ? { include: this.config.include } : {}),
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: `${this.config.auditEntity}.update`,
        entity: this.config.auditEntity,
        entityId: id,
        metadata: this.auditMetadata(item),
      });

      return item;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);

    if (this.config.checkRelationsOnDelete && this.config.checkRelationsOnDelete.length > 0) {
      const includeConfig = this.config.checkRelationsOnDelete.reduce((acc, rel) => ({ ...acc, [rel]: true }), {});
      const itemWithRelations = await this.delegate().findUnique({
        where: { id },
        include: includeConfig,
      });

      if (itemWithRelations) {
        const activeRelations = this.config.checkRelationsOnDelete.filter((rel) => {
          const relationData = itemWithRelations[rel];
          if (Array.isArray(relationData)) {
            return relationData.some((r: any) => r.deletedAt === null || r.deletedAt === undefined);
          } else if (relationData) {
            return (relationData as any).deletedAt === null || (relationData as any).deletedAt === undefined;
          }
          return false;
        });

        if (activeRelations.length > 0) {
          throw new ConflictException(
            `Cannot delete ${this.config.auditEntity} because it is referenced by active records in: ${activeRelations.join(", ")}`,
          );
        }
      }
    }

    const item = await this.delegate().update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: `${this.config.auditEntity}.delete`,
      entity: this.config.auditEntity,
      entityId: id,
      metadata: this.auditMetadata(existing),
    });

    return { id: String(item.id), deleted: true };
  }

  private buildWhere(search?: string) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (search && this.config.searchableFields.length) {
      where.OR = this.config.searchableFields.map((field) => ({
        [field]: {
          contains: search,
          mode: "insensitive",
        },
      }));
    }

    return where;
  }

  private delegate() {
    return (this.prisma as unknown as Record<string, MasterDataDelegate>)[this.config.modelName];
  }

  private auditMetadata(item: unknown): Prisma.InputJsonValue {
    if (!item || typeof item !== "object") {
      return {};
    }

    const record = item as Record<string, unknown>;

    const metadata: Record<string, string> = {};

    if (typeof record.code === "string") metadata.code = record.code;
    if (typeof record.name === "string") metadata.name = record.name;

    return metadata;
  }

  private handlePrismaError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(`${this.config.auditEntity} unique field already exists`);
    }
  }
}

type MasterDataDelegate = {
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<Record<string, unknown>>;
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Array<Record<string, unknown>>>;
  update(args: unknown): Promise<Record<string, unknown>>;
};
