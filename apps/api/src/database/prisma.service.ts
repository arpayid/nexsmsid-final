import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, PrismaClient } from "@prisma/client";

const MODELS_WITH_DELETED_AT = new Set(
  Prisma.dmmf.datamodel.models.filter((m) => m.fields.some((f) => f.name === "deletedAt")).map((m) => m.name),
);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.getOrThrow<string>("DATABASE_URL"),
        },
      },
      log: ["warn", "error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Connected to PostgreSQL via Prisma");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  softDeleteModel() {
    return this.$extends({
      query: {
        $allModels: {
          async findUnique({ model, args, query }) {
            if (MODELS_WITH_DELETED_AT.has(model)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (MODELS_WITH_DELETED_AT.has(model)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
          async findMany({ model, args, query }) {
            if (MODELS_WITH_DELETED_AT.has(model)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
        },
      },
    });
  }
}
