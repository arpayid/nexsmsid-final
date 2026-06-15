import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  getBasicHealth() {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }

  async getDetailedHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

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
      return "configured";
    }
  }
}
