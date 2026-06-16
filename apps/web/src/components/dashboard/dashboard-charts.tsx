"use client";

import { type ReactElement } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, ChartCard } from "@nexsmsid/ui";

import type { FinanceSummary, PpdbSummary } from "./dashboard-types";
import { CHART_TOOLTIP_STYLE, formatCurrency } from "./dashboard-utils";

type DashboardChartsProps = {
  finance: FinanceSummary;
  ppdb: PpdbSummary;
};

export function DashboardCharts({ finance, ppdb }: DashboardChartsProps) {
  const ppdbStatusData = Object.entries(ppdb.byStatus).map(([status, count]) => ({ status, count }));
  const financeMonthly = finance.monthly.length ? finance.monthly : [{ month: "Belum ada", income: 0, expense: 0 }];

  return (
    <>
      <ChartCard
        action={<Badge variant="success">Prioritas</Badge>}
        className="h-full lg:min-h-[22rem]"
        description="Pembayaran terverifikasi dibanding pengeluaran bulanan."
        title="Arus Kas Bulanan"
      >
        <ChartFrame tall>
          <AreaChart data={financeMonthly} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis axisLine={false} dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} tickLine={false} tickMargin={12} />
            <YAxis
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickFormatter={(v) => `${Number(v) / 1_000_000}jt`}
              tickLine={false}
              tickMargin={12}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => formatCurrency(Number(value))} />
            <Area dataKey="income" fill="#10b98133" name="Masuk" stroke="#10B981" strokeWidth={3} type="monotone" />
            <Area dataKey="expense" fill="#f59e0b33" name="Keluar" stroke="#F59E0B" strokeWidth={3} type="monotone" />
          </AreaChart>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        action={<Badge variant="success">Prioritas</Badge>}
        className="h-full lg:min-h-[22rem]"
        description="Distribusi pendaftaran berdasarkan status."
        title="Status Pendaftaran PPDB"
      >
        <ChartFrame tall>
          <BarChart data={ppdbStatusData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis axisLine={false} dataKey="status" tick={{ fill: "#64748B", fontSize: 12 }} tickLine={false} tickMargin={12} />
            <YAxis axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickLine={false} tickMargin={12} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#10B981" name="Pendaftar" radius={[10, 10, 0, 0]} />
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
