import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getBasicHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      Logger.warn(`getBasicHealth: database health check failed — ${error instanceof Error ? error.message : String(error)}`);
      throw new ServiceUnavailableException("Database connection failed");
    }
  }

  async getDetailedHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      Logger.warn(`getDetailedHealth: database health check failed — ${error instanceof Error ? error.message : String(error)}`);
      return {
        service: "api",
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: { provider: "postgresql", status: "error" },
      };
    }

    return {
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: {
        provider: "postgresql",
        status: "connected",
      },
      redis: {
        status: "configured",
        url: this.maskUrl(this.configService.getOrThrow<string>("REDIS_URL")),
      },
    };
  }

  getVersion() {
    return {
      name: "NexSMSID API",
      version: process.env.npm_package_version ?? "0.0.0",
      environment: this.configService.getOrThrow<string>("NODE_ENV"),
      apiPrefix: this.configService.getOrThrow<string>("API_PREFIX"),
      redisConfigured: Boolean(this.configService.getOrThrow<string>("REDIS_URL")),
    };
  }

  private maskUrl(value: string) {
    try {
      const url = new URL(value);

      if (url.password) {
        url.password = "***";
      }

      return url.toString();
    } catch {
      Logger.warn(`Failed to parse REDIS_URL for masking`);
      return "configured";
    }
  }
}
