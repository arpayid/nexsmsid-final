"use client";

import { type ReactElement } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, ChartCard, EmptyState } from "@nexsmsid/ui";

import type { AcademicSummary, FinanceSummary, PpdbSummary } from "./dashboard-types";
import { CHART_COLORS, CHART_TOOLTIP_STYLE, formatCurrency, formatNumber } from "./dashboard-utils";

type DashboardChartsProps = {
  academic: AcademicSummary;
  finance: FinanceSummary;
  ppdb: PpdbSummary;
};

export function DashboardCharts({ academic, finance, ppdb }: DashboardChartsProps) {
  const ppdbStatusData = Object.entries(ppdb.byStatus).map(([status, count]) => ({ status, count }));
  const attendanceData = Object.entries(academic.attendanceThisWeek).map(([status, count]) => ({ status, count }));
  const financeMonthly = finance.monthly.length ? finance.monthly : [{ month: "Belum ada", income: 0, expense: 0 }];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          action={<Badge variant="success">Prioritas</Badge>}
          className="lg:min-h-[22rem]"
          description="Pembayaran terverifikasi dibanding pengeluaran bulanan."
          title="Arus Kas Bulanan"
        >
          <ChartFrame tall>
            <AreaChart data={financeMonthly} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
              <CartesianGrid stroke="hsl(214 20% 90%)" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={12} />
              <YAxis axisLine={false} tickFormatter={(v) => `${Number(v) / 1_000_000}jt`} tickLine={false} tickMargin={12} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => formatCurrency(Number(value))} />
              <Area dataKey="income" fill="#10b98133" name="Masuk" stroke="#10b981" strokeWidth={3} type="monotone" />
              <Area dataKey="expense" fill="#f59e0b33" name="Keluar" stroke="#f59e0b" strokeWidth={3} type="monotone" />
            </AreaChart>
          </ChartFrame>
        </ChartCard>

        <ChartCard
          action={<Badge variant="info">Prioritas</Badge>}
          className="lg:min-h-[22rem]"
          description="Distribusi pendaftaran berdasarkan status."
          title="Status Pendaftaran PPDB"
        >
          <ChartFrame tall>
            <BarChart data={ppdbStatusData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
              <CartesianGrid stroke="hsl(214 20% 90%)" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="status" tickLine={false} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} tickMargin={12} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#14997a" name="Pendaftar" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          action={<Badge variant="secondary">Presensi</Badge>}
          description="Rekap status presensi minggu berjalan."
          title="Rekap Presensi"
        >
          {attendanceData.length ? (
            <ChartFrame>
              <PieChart>
                <Pie data={attendanceData} dataKey="count" innerRadius={58} nameKey="status" outerRadius={96} paddingAngle={3}>
                  {attendanceData.map((entry, index) => (
                    <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={entry.status} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ChartFrame>
          ) : (
            <div className="flex h-72 items-center justify-center px-4">
              <EmptyState description="Belum ada data presensi minggu ini." title="Data kosong" />
            </div>
          )}
        </ChartCard>

        <ChartCard
          action={<Badge variant="outline">Keuangan</Badge>}
          description="Ringkasan invoice dan pembayaran terverifikasi."
          title="Ringkasan Keuangan"
        >
          <div className="grid h-72 grid-cols-2 gap-3 p-1">
            <FinanceSummaryTile label="Total invoice" value={formatCurrency(finance.invoices.total)} />
            <FinanceSummaryTile label="Sudah dibayar" value={formatNumber(finance.invoices.paid)} />
            <FinanceSummaryTile label="Pembayaran OK" value={formatNumber(finance.payments.count)} />
            <FinanceSummaryTile label="Pengeluaran" value={formatCurrency(finance.expenses.total)} />
          </div>
        </ChartCard>
      </div>
    </div>
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

function FinanceSummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-border/70 bg-muted/10 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
    </div>
  );
}
