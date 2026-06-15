import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { ReportRegistryService } from "../report-engine/report-registry.service";

@Injectable()
export class ReportCenterService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ReportRegistryService) private readonly registry: ReportRegistryService,
  ) {}

  async getReportTypes() {
    return this.registry.getAll();
  }

  async summary() {
    const [totalJobs, pendingJobs, processingJobs, completedJobs, failedJobs, cancelledJobs, totalExports, recentJobs] = await Promise.all([
      this.prisma.reportJob.count(),
      this.prisma.reportJob.count({ where: { status: "PENDING" } }),
      this.prisma.reportJob.count({ where: { status: "PROCESSING" } }),
      this.prisma.reportJob.count({ where: { status: "COMPLETED" } }),
      this.prisma.reportJob.count({ where: { status: "FAILED" } }),
      this.prisma.reportJob.count({ where: { status: "CANCELLED" } }),
      this.prisma.exportHistory.count(),
      this.prisma.reportJob.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { requestedBy: { select: { id: true, email: true, name: true } } },
      }),
    ]);

    return {
      jobs: {
        total: totalJobs,
        pending: pendingJobs,
        processing: processingJobs,
        completed: completedJobs,
        failed: failedJobs,
        cancelled: cancelledJobs,
      },
      exports: { total: totalExports },
      availableTypes: this.registry.getAll().map((r) => r.code),
      recentJobs,
    };
  }
}
