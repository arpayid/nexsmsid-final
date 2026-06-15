import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";

export const peopleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  classroomId: z.string().trim().optional(),
});

export type PeopleDataConfig<TCreate extends z.ZodType, TUpdate extends z.ZodType> = {
  auditEntity: string;
  createSchema: TCreate;
  defaultOrderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, unknown>;
  modelName: string;
  searchableFields: string[];
  updateSchema: TUpdate;
  useSoftDelete?: boolean;
};

type PeopleDelegate = {
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<Record<string, unknown>>;
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Array<Record<string, unknown>>>;
  update(args: unknown): Promise<Record<string, unknown>>;
};

@Injectable()
export class BasePeopleService<TCreate extends z.ZodType, TUpdate extends z.ZodType> {
  constructor(
    @Inject(PrismaService) protected readonly prisma: PrismaService,
    @Inject(AuditService) protected readonly auditService: AuditService,
    private readonly config: PeopleDataConfig<TCreate, TUpdate>,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(peopleListQuerySchema, query);
    const delegate = this.delegate();
    const where = this.buildWhere(params);
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
    const where = this.config.useSoftDelete ? { id, deletedAt: null } : { id };
    const item = await this.delegate().findFirst({
      where,
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

    const data: Record<string, unknown> = {};

    if (this.config.useSoftDelete) {
      data.deletedAt = new Date();
    }

    if (typeof (existing as { status?: unknown }).status === "string") {
      data.status = "INACTIVE";
    }

    const item = await this.delegate().update({
      where: { id },
      data,
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

  private buildWhere(params: { search?: string; status?: string; classroomId?: string }) {
    const where: Record<string, unknown> = {};

    if (this.config.useSoftDelete) {
      where.deletedAt = null;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.classroomId) {
      where.classroomId = params.classroomId;
    }

    if (params.search && this.config.searchableFields.length) {
      where.OR = this.config.searchableFields.map((field) => ({
        [field]: {
          contains: params.search,
          mode: "insensitive",
        },
      }));
    }

    return where;
  }

  private delegate() {
    return (this.prisma as unknown as Record<string, PeopleDelegate>)[this.config.modelName];
  }

  private auditMetadata(item: unknown): Prisma.InputJsonValue {
    if (!item || typeof item !== "object") {
      return {};
    }

    const record = item as Record<string, unknown>;
    const metadata: Record<string, string> = {};

    if (typeof record.name === "string") metadata.name = record.name;
    if (typeof record.nis === "string") metadata.nis = record.nis;
    if (typeof record.nip === "string") metadata.nip = record.nip;
    if (typeof record.status === "string") metadata.status = record.status;
    if (typeof record.email === "string") metadata.email = record.email;

    return metadata;
  }

  private handlePrismaError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(`${this.config.auditEntity} unique field already exists`);
    }
  }
}
