import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PpdbDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async summary() {
    const [activePeriods, totalRegistrations, byStatus, departments] = await Promise.all([
      this.prisma.ppdbPeriod.count({ where: { isActive: true } }),
      this.prisma.ppdbRegistration.count(),
      Promise.all([
        this.prisma.ppdbRegistration.count({ where: { status: "SUBMITTED" } }),
        this.prisma.ppdbRegistration.count({ where: { status: "VERIFIED" } }),
        this.prisma.ppdbRegistration.count({ where: { status: "ACCEPTED" } }),
        this.prisma.ppdbRegistration.count({ where: { status: "REJECTED" } }),
        this.prisma.ppdbRegistration.count({ where: { status: "CONVERTED" } }),
        this.prisma.ppdbRegistration.count({ where: { status: "REVISION" } }),
      ]),
      this.prisma.ppdbRegistration.groupBy({
        by: ["selectedDepartmentId"],
        _count: true,
        where: { selectedDepartmentId: { not: null } },
      }),
    ]);

    return {
      activePeriods,
      totalRegistrations,
      byStatus: {
        submitted: byStatus[0],
        verified: byStatus[1],
        accepted: byStatus[2],
        rejected: byStatus[3],
        converted: byStatus[4],
        revision: byStatus[5],
      },
      byDepartment: departments.map((d) => ({ departmentId: d.selectedDepartmentId, count: d._count })),
    };
  }

  async statusChart() {
    const registrations = await this.prisma.ppdbRegistration.findMany({
      select: { status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyMap = new Map<string, Record<string, number>>();

    for (const reg of registrations) {
      const key = `${reg.createdAt.getFullYear()}-${String(reg.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? {};
      entry[reg.status] = (entry[reg.status] ?? 0) + 1;
      monthlyMap.set(key, entry);
    }

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, statuses]) => ({ month, ...statuses }));
  }
}
