"use client";

import { CalendarCheck, GraduationCap, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { FinanceSummary, Overview } from "./dashboard-types";
import { formatCurrency, formatNumber } from "./dashboard-utils";

type DashboardKpiRowProps = {
  finance: FinanceSummary;
  overview: Overview;
};

type KpiTone = "emerald" | "indigo" | "amber" | "teal";

const toneStyles: Record<KpiTone, { icon: string; spark: string }> = {
  teal: { icon: "bg-teal-100 text-teal-700 ring-teal-200/80", spark: "#14B8A6" },
  indigo: { icon: "bg-indigo-100 text-indigo-700 ring-indigo-200/80", spark: "#6366F1" },
  amber: { icon: "bg-amber-100 text-amber-700 ring-amber-200/80", spark: "#F59E0B" },
  emerald: { icon: "bg-emerald-100 text-emerald-700 ring-emerald-200/80", spark: "#10B981" },
};

export function DashboardKpiRow({ finance, overview }: DashboardKpiRowProps) {
  const incomeTrend = finance.monthly.map((row) => row.income || 0);
  const expenseTrend = finance.monthly.map((row) => row.expense || 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        description={`${formatNumber(overview.people.guardians)} wali terdaftar`}
        icon={UsersRound}
        sparkline={padSparkline(incomeTrend.length ? incomeTrend : [overview.people.studentsActive])}
        title="Siswa Aktif"
        tone="teal"
        value={formatNumber(overview.people.studentsActive)}
      />
      <DashboardKpiCard
        description={`${formatNumber(overview.academic.subjects)} mata pelajaran · ${formatNumber(overview.academic.classrooms)} kelas`}
        icon={GraduationCap}
        sparkline={padSparkline([overview.people.teachersActive, overview.academic.subjects, overview.academic.classrooms])}
        title="Guru Aktif"
        tone="indigo"
        value={formatNumber(overview.people.teachersActive)}
      />
      <DashboardKpiCard
        description={`${formatNumber(overview.finance.outstandingInvoices)} tagihan belum lunas`}
        icon={WalletCards}
        sparkline={padSparkline(expenseTrend.length ? expenseTrend : [overview.finance.outstandingAmount])}
        title="Tagihan Outstanding"
        tone="amber"
        value={formatCurrency(overview.finance.outstandingAmount)}
      />
      <DashboardKpiCard
        description={`${formatNumber(overview.academic.assessmentsThisSemester)} penilaian semester ini`}
        icon={CalendarCheck}
        sparkline={padSparkline([0, overview.academic.attendanceSessionsThisWeek, overview.academic.assessmentsThisSemester])}
        title="Sesi Presensi Minggu Ini"
        tone="emerald"
        value={formatNumber(overview.academic.attendanceSessionsThisWeek)}
      />
    </div>
  );
}

function DashboardKpiCard({
  description,
  icon: Icon,
  sparkline,
  title,
  tone,
  value,
}: {
  description: string;
  icon: LucideIcon;
  sparkline: number[];
  title: string;
  tone: KpiTone;
  value: string;
}) {
  const palette = toneStyles[tone];
  const chartData = sparkline.map((v, i) => ({ i, v }));

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-card ring-1 ring-black/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 h-10 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <Area dataKey="v" dot={false} fill={`${palette.spark}33`} stroke={palette.spark} strokeWidth={2} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function padSparkline(values: number[]): number[] {
  if (values.length >= 4) return values.slice(-6);
  return [...values, ...Array.from({ length: Math.max(0, 4 - values.length) }, () => values.at(-1) ?? 0)];
}
