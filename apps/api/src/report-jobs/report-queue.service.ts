import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker, type ConnectionOptions } from "bullmq";

import { PrismaService } from "../database/prisma.service";
import { ReportDataService } from "../report-engine/report-data.service";
import { ReportRendererService } from "../report-engine/report-renderer.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";

type ReportQueuePayload = { reportJobId: string };

@Injectable()
export class ReportQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportQueueService.name);
  private readonly connection: ConnectionOptions;
  private readonly queue: Queue<ReportQueuePayload>;
  private worker?: Worker<ReportQueuePayload>;

  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ReportDataService) private readonly reportData: ReportDataService,
    @Inject(ReportRendererService) private readonly reportRenderer: ReportRendererService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {
    this.connection = this.redisConnection(configService.get<string>("REDIS_URL") ?? "redis://localhost:6379");
    this.queue = new Queue<ReportQueuePayload>("reportQueue", { connection: this.connection });
  }

  onModuleInit() {
    this.worker = new Worker<ReportQueuePayload>(
      "reportQueue",
      async (job) => {
        await this.processReportJob(job.data.reportJobId);
      },
      { connection: this.connection, concurrency: 1 },
    );

    this.worker.on("error", (error) => this.logger.warn(`Report queue worker error: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
  }

  async enqueueReportJob(reportJobId: string) {
    try {
      await this.queue.add("generate-report", { reportJobId }, { jobId: reportJobId, removeOnComplete: true, removeOnFail: 100 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown queue error";
      this.logger.warn(`Unable to enqueue report job ${reportJobId}: ${message}. Processing directly.`);
    }

    // Still process directly if queue fails or for sync behavior in dev
    await this.processReportJob(reportJobId);
  }

  async removeReportJob(reportJobId: string) {
    try {
      const job = await this.queue.getJob(reportJobId);
      await job?.remove();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown queue error";
      this.logger.warn(`Unable to remove report job ${reportJobId}: ${message}`);
    }
  }

  async processReportJob(reportJobId: string) {
    const claimed = await this.prisma.reportJob.updateMany({
      where: { id: reportJobId, status: "PENDING" },
      data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null },
    });

    if (claimed.count === 0) return;

    const reportJob = await this.prisma.reportJob.findUnique({ where: { id: reportJobId } });
    if (!reportJob) return;

    try {
      // 1. Get Data
      const filters = (reportJob.parameters as any) || {};
      const data = await this.reportData.getData(reportJob.type, filters);

      // 2. Render
      const fileName = `${reportJob.type.toLowerCase()}-${reportJob.id}.${reportJob.format.toLowerCase()}`;
      await this.reportRenderer.render(data, reportJob.format as any, fileName);

      const fileUrl = `/api/v1/reports/download/${reportJob.id}`;
      const rowCount = data.rows.length;

      // 3. Update DB
      await this.prisma.$transaction([
        this.prisma.reportJob.update({
          where: { id: reportJob.id },
          data: { status: "COMPLETED", completedAt: new Date(), resultUrl: fileUrl, errorMessage: null },
        }),
        this.prisma.exportHistory.create({
          data: {
            reportJobId: reportJob.id,
            entity: reportJob.type,
            format: reportJob.format,
            fileName,
            fileUrl,
            rowCount,
            requestedById: reportJob.requestedById,
          },
        }),
      ]);

      // 4. Audit & Notification
      if (reportJob.requestedById) {
        await this.audit.record({
          actorId: reportJob.requestedById,
          action: "report.completed",
          entity: "ReportJob",
          entityId: reportJob.id,
          metadata: { type: reportJob.type, format: reportJob.format },
        });

        await this.notifications.createSystemNotification({
          userId: reportJob.requestedById,
          title: "Report Completed",
          body: `Your report "${reportJob.title || reportJob.type}" is ready for download.`,
          metadata: { reportJobId: reportJob.id, type: "REPORT_COMPLETED" },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown report processing error";
      this.logger.error(`Failed to process report job ${reportJobId}: ${message}`, error instanceof Error ? error.stack : undefined);

      await this.prisma.reportJob.update({
        where: { id: reportJob.id },
        data: { status: "FAILED", completedAt: new Date(), errorMessage: message },
      });

      if (reportJob.requestedById) {
        await this.audit.record({
          actorId: reportJob.requestedById,
          action: "report.failed",
          entity: "ReportJob",
          entityId: reportJob.id,
          metadata: { type: reportJob.type, error: message },
        });

        await this.notifications.createSystemNotification({
          userId: reportJob.requestedById,
          title: "Report Failed",
          body: `Failed to generate report "${reportJob.title || reportJob.type}": ${message}`,
          metadata: { reportJobId: reportJob.id, type: "REPORT_FAILED" },
        });
      }

      throw error;
    }
  }

  private redisConnection(redisUrl: string): ConnectionOptions {
    const url = new URL(redisUrl);
    const db = Number(url.pathname.replace("/", ""));
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      db: Number.isNaN(db) ? undefined : db,
      tls: url.protocol === "rediss:" ? {} : undefined,
    };
  }
}
