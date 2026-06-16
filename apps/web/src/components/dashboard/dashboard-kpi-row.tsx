import { CalendarCheck, GraduationCap, UsersRound, WalletCards } from "lucide-react";

import { StatCard } from "@nexsmsid/ui";

import type { Overview } from "./dashboard-types";
import { formatCurrency, formatNumber } from "./dashboard-utils";

type DashboardKpiRowProps = {
  overview: Overview;
};

export function DashboardKpiRow({ overview }: DashboardKpiRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        description={`${formatNumber(overview.people.guardians)} wali terdaftar`}
        icon={<UsersRound className="h-5 w-5" />}
        title="Siswa Aktif"
        tone="teal"
        value={formatNumber(overview.people.studentsActive)}
      />
      <StatCard
        description={`${formatNumber(overview.academic.subjects)} mata pelajaran · ${formatNumber(overview.academic.classrooms)} kelas`}
        icon={<GraduationCap className="h-5 w-5" />}
        title="Guru Aktif"
        tone="blue"
        value={formatNumber(overview.people.teachersActive)}
      />
      <StatCard
        description={`${formatNumber(overview.finance.outstandingInvoices)} tagihan belum lunas`}
        icon={<WalletCards className="h-5 w-5" />}
        title="Tagihan Outstanding"
        tone="amber"
        value={formatCurrency(overview.finance.outstandingAmount)}
      />
      <StatCard
        description={`${formatNumber(overview.academic.assessmentsThisSemester)} penilaian semester ini`}
        icon={<CalendarCheck className="h-5 w-5" />}
        title="Sesi Presensi Minggu Ini"
        tone="emerald"
        value={formatNumber(overview.academic.attendanceSessionsThisWeek)}
      />
    </div>
  );
}
