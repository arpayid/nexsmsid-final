import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class BkkDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async summary() {
    const [partners, internships, alumni, jobs, applications, tracerStudies] = await Promise.all([
      this.prisma.industryPartner.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      this.prisma.internship.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      this.prisma.alumni.count({ where: { deletedAt: null } }),
      this.prisma.jobVacancy.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      this.prisma.jobApplication.count(),
      this.prisma.tracerStudy.count(),
    ]);
    const internshipStatus = Object.fromEntries(internships.map((item) => [item.status.toLowerCase(), item._count]));
    const jobStatus = Object.fromEntries(jobs.map((item) => [item.status.toLowerCase(), item._count]));
    return { partners, internships: internshipStatus, alumni, jobs: jobStatus, applications, tracerStudies };
  }

  async jobStatusChart() {
    return this.prisma.jobVacancy.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true });
  }

  async alumniStatusChart() {
    return this.prisma.alumni.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true });
  }
}
