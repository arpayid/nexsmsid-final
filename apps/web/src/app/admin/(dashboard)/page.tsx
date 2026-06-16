"use client";

import { BarChart3, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";

import { Button, ErrorState, PageHeader } from "@nexsmsid/ui";

import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import { DashboardModuleLinks } from "@/components/dashboard/dashboard-module-links";
import { DashboardSystemStatus } from "@/components/dashboard/dashboard-system-status";
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

  if (loading) {
    return <DashboardLoading />;
  }

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
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="soft">
              <Link href="/admin/reports">
                <BarChart3 className="h-4 w-4" /> Laporan
              </Link>
            </Button>
            <Button disabled={loading} onClick={() => void refetch()} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Muat Ulang
            </Button>
          </>
        }
        description="Ringkasan operasional sekolah — akademik, keuangan, PPDB, dan peringatan yang perlu ditindaklanjuti."
        eyebrow="Dashboard Operasional"
        title="Selamat datang di NexAdmin"
      />

      <DashboardKpiRow overview={data.overview} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardCharts academic={data.academic} finance={data.finance} ppdb={data.ppdb} />
        </div>
        <div className="space-y-4 xl:col-span-4">
          <DashboardAlerts alerts={data.alerts} />
          <DashboardSystemStatus status={data.system} unread={data.overview.notifications.unread} />
        </div>
      </div>

      <DashboardModuleLinks overview={data.overview} />
      <DashboardActivity activity={data.activity} />
    </div>
  );
}
