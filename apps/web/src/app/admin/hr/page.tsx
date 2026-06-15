"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, BriefcaseBusiness, CalendarOff, Loader2, UserCheck, Users } from "lucide-react";

import { Card, CardContent, PageHeader, StatCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type HRSummary = {
  totalEmployees?: number;
  contractEmployees?: number;
  presentToday?: number;
  pendingLeaves?: number;
  inactiveEmployees?: number;
};

export default function Page() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.getHRSummary() as Promise<HRSummary>, [api]);
  const { data: summary, error, loading } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "HR", "Dashboard"]}
        description="Ringkasan pegawai, kehadiran, dan pengajuan cuti/izin."
        eyebrow="Kepegawaian"
        title="HR Dashboard"
      />

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent>
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat ringkasan HR...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Pegawai"
            value={String(summary.totalEmployees ?? 0)}
            description="Semua profil pegawai"
            icon={<Users className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Kontrak"
            value={String(summary.contractEmployees ?? 0)}
            description="Pegawai kontrak"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            title="Hadir Hari Ini"
            value={String(summary.presentToday ?? 0)}
            description="Presensi PRESENT"
            icon={<UserCheck className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            title="Cuti Pending"
            value={String(summary.pendingLeaves ?? 0)}
            description="Menunggu approval"
            icon={<CalendarOff className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            title="Tidak Aktif"
            value={String(summary.inactiveEmployees ?? 0)}
            description="Inactive/terminated/retired"
            icon={<AlertCircle className="h-5 w-5" />}
            tone="amber"
          />
        </div>
      ) : null}
    </div>
  );
}
