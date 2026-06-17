"use client";

import { useMemo, useState, type ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, ChartCard, cn } from "@nexsmsid/ui";

import type { AcademicSummary } from "./dashboard-types";
import { CHART_TOOLTIP_STYLE } from "./dashboard-utils";

type DashboardChartsProps = {
  academic: AcademicSummary;
};

const RANGE_OPTIONS = [
  { label: "6 Bulan Terakhir", months: 6 },
  { label: "3 Bulan Terakhir", months: 3 },
] as const;

export function DashboardCharts({ academic }: DashboardChartsProps) {
  const [rangeMonths, setRangeMonths] = useState<(typeof RANGE_OPTIONS)[number]["months"]>(6);

  const attendanceData = useMemo(() => (academic.attendanceTrend ?? []).slice(-rangeMonths), [academic.attendanceTrend, rangeMonths]);
  const peopleData = useMemo(() => (academic.peopleComparison ?? []).slice(-rangeMonths), [academic.peopleComparison, rangeMonths]);

  const rangeAction = (
    <div className="flex flex-wrap gap-1">
      {RANGE_OPTIONS.map((option) => (
        <button
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            rangeMonths === option.months
              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
              : "text-muted-foreground hover:bg-muted",
          )}
          key={option.months}
          onClick={() => setRangeMonths(option.months)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <ChartCard
        action={rangeAction}
        className="h-full lg:min-h-[22rem]"
        description="Persentase kehadiran siswa per bulan."
        title="Tren Kehadiran Siswa"
      >
        <ChartFrame tall>
          <LineChart data={attendanceData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(value: string) => value.split(" ")[0] ?? value}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              domain={[0, 100]}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              tickMargin={12}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`${value}%`, "Kehadiran"]} />
            <Line
              activeDot={{ r: 5 }}
              dataKey="rate"
              dot={{ fill: "#10B981", r: 3 }}
              name="Kehadiran"
              stroke="#10B981"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        action={<Badge variant="secondary">Perbandingan</Badge>}
        className="h-full lg:min-h-[22rem]"
        description="Jumlah siswa dan guru aktif per bulan."
        title="Perbandingan Siswa & Guru Aktif"
      >
        <ChartFrame tall>
          <BarChart data={peopleData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(value: string) => value.split(" ")[0] ?? value}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickLine={false} tickMargin={12} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="students" fill="#10B981" name="Siswa" radius={[8, 8, 0, 0]} />
            <Bar dataKey="teachers" fill="#6366F1" name="Guru" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartFrame>
      </ChartCard>
    </>
  );
}

function ChartFrame({ children, tall }: { children: ReactElement; tall?: boolean }) {
  return (
    <div className={tall ? "h-80" : "h-72"}>
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
