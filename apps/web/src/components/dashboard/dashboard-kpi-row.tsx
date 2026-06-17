"use client";

import { GraduationCap, School, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Badge } from "@nexsmsid/ui";

import type { AcademicSummary, FinanceSummary, Overview } from "./dashboard-types";
import { formatCurrency, formatNumber, percentChange } from "./dashboard-utils";

type DashboardKpiRowProps = {
  academic: AcademicSummary;
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

export function DashboardKpiRow({ academic, finance, overview }: DashboardKpiRowProps) {
  const peopleTrend = academic.peopleComparison ?? [];
  const incomeTrend = finance.monthly.map((row) => row.income || 0);
  const studentSpark = peopleTrend.map((row) => row.students);
  const teacherSpark = peopleTrend.map((row) => row.teachers);
  const classroomSpark = peopleTrend.map((row) => row.classrooms);

  const studentDelta = percentChange(
    peopleTrend.at(-2)?.students ?? overview.people.studentsActive,
    peopleTrend.at(-1)?.students ?? overview.people.studentsActive,
  );
  const teacherDelta = percentChange(
    peopleTrend.at(-2)?.teachers ?? overview.people.teachersActive,
    peopleTrend.at(-1)?.teachers ?? overview.people.teachersActive,
  );
  const classroomDelta = percentChange(
    peopleTrend.at(-2)?.classrooms ?? overview.academic.classrooms,
    peopleTrend.at(-1)?.classrooms ?? overview.academic.classrooms,
  );
  const paymentDelta = percentChange(incomeTrend.at(-2) ?? 0, incomeTrend.at(-1) ?? finance.payments.total);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        change={studentDelta}
        icon={UsersRound}
        sparkline={padSparkline(studentSpark.length ? studentSpark : [overview.people.studentsActive])}
        title="Siswa Aktif"
        tone="teal"
        value={formatNumber(overview.people.studentsActive)}
      />
      <DashboardKpiCard
        change={teacherDelta}
        icon={GraduationCap}
        sparkline={padSparkline(teacherSpark.length ? teacherSpark : [overview.people.teachersActive])}
        title="Guru Aktif"
        tone="indigo"
        value={formatNumber(overview.people.teachersActive)}
      />
      <DashboardKpiCard
        change={classroomDelta}
        icon={School}
        sparkline={padSparkline(classroomSpark.length ? classroomSpark : [overview.academic.classrooms])}
        title="Kelas Aktif"
        tone="emerald"
        value={formatNumber(overview.academic.classrooms)}
      />
      <DashboardKpiCard
        change={paymentDelta}
        icon={WalletCards}
        sparkline={padSparkline(incomeTrend.length ? incomeTrend : [finance.payments.total])}
        title="Total Pembayaran"
        tone="amber"
        value={formatCurrency(finance.payments.total)}
      />
    </div>
  );
}

function DashboardKpiCard({
  change,
  icon: Icon,
  sparkline,
  title,
  tone,
  value,
}: {
  change: number | null;
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {change !== null ? (
              <Badge className="text-[10px] font-semibold normal-case tracking-normal" variant={change >= 0 ? "success" : "warning"}>
                {change >= 0 ? "+" : ""}
                {change.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">vs bulan lalu</p>
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
