"use client";

import { RefreshCcw } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button, ErrorState } from "@nexsmsid/ui";

import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardFinanceSummary } from "@/components/dashboard/dashboard-finance-summary";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import type { DashboardData } from "@/components/dashboard/dashboard-types";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function AdminDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadDashboard = useCallback(async () => {
    const [overview, academic, finance, ppdb, people, activity, alerts, system] = await Promise.all([
      api.dashboardOverview(),
      api.dashboardAcademicSummary(),
      api.dashboardFinanceSummary(),
      api.dashboardPpdbSummary(),
      api.dashboardPeopleSummary(),
      api.dashboardActivityFeed(),
      api.dashboardQuickAlerts(),
      api.dashboardSystemStatus(),
    ]);
    return { overview, academic, finance, ppdb, people, activity, alerts, system } as DashboardData;
  }, [api]);

  const { data, error, loading, refetch } = useApiQuery<DashboardData>(loadDashboard, [api]);

  if (loading) return <DashboardLoading />;

  if (error || !data) {
    return (
      <ErrorState
        action={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Coba Lagi
          </Button>
        }
        message={error ?? "Data dashboard tidak tersedia"}
        title="Gagal memuat dashboard"
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHero loading={loading} onRefresh={() => void refetch()} />
      <DashboardKpiRow academic={data.academic} finance={data.finance} overview={data.overview} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCharts academic={data.academic} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardAlerts alerts={data.alerts} />
        <DashboardFinanceSummary finance={data.finance} />
      </div>
    </div>
  );
}
