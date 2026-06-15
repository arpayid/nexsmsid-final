import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MailerService } from "../notifications/mailer.service";
import { PrismaService } from "../database/prisma.service";
import { ReportQueueService } from "./report-queue.service";

@Injectable()
export class ReportScheduleService {
  private readonly logger = new Logger(ReportScheduleService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ReportQueueService) private readonly reportQueue: ReportQueueService,
    @Inject(MailerService) private readonly mailer: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateDailyReports() {
    this.logger.log("Running daily report generation...");
    const jobs = await this.prisma.reportJob.findMany({
      where: { status: "PENDING" },
    });
    for (const job of jobs) {
      try {
        await this.reportQueue.enqueueReportJob(job.id);
        this.logger.log(`Scheduled report job ${job.id} enqueued`);
      } catch (error) {
        this.logger.error(`Failed to enqueue scheduled report ${job.id}: ${(error as Error).message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEKEND)
  async generateWeeklyReports() {
    this.logger.log("Running weekly report generation...");
    const jobs = await this.prisma.reportJob.findMany({
      where: { status: "PENDING" },
    });
    for (const job of jobs) {
      try {
        await this.reportQueue.enqueueReportJob(job.id);
        this.logger.log(`Weekly report job ${job.id} enqueued`);
      } catch (error) {
        this.logger.error(`Failed to enqueue weekly report ${job.id}: ${(error as Error).message}`);
      }
    }
  }
}
