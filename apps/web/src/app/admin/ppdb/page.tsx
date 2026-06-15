"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, FileText, Loader2, UserCheck, UserMinus, UserPlus, UserX, Users } from "lucide-react";
import Link from "next/link";

import { Button, Card, CardContent, PageHeader, StatCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Terkirim",
  verified: "Terverifikasi",
  accepted: "Diterima",
  rejected: "Ditolak",
  converted: "Dikonversi",
};

export default function PpdbDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(async () => {
    const response = await api.getPpdbSummary();
    return response as unknown as Record<string, unknown>;
  }, [api]);
  const { data: summary, error, loading } = useApiQuery<Record<string, unknown>>(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/ppdb/periods">Periode PPDB</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/ppdb/registrations">Pendaftaran</Link>
            </Button>
          </div>
        }
        breadcrumb={["Admin", "PPDB"]}
        description="Ringkasan dan statistik PPDB."
        eyebrow="PPDB"
        title="Dashboard PPDB"
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
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat ringkasan PPDB...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            description="Total seluruh pendaftar"
            icon={<Users className="h-5 w-5" />}
            title="Total Pendaftaran"
            tone="violet"
            value={String(summary.total ?? summary.totalRegistrations ?? 0)}
          />
          <StatCard
            description="Pendaftar menunggu verifikasi"
            icon={<FileText className="h-5 w-5" />}
            title={STATUS_LABEL.submitted ?? "Terkirim"}
            tone="blue"
            value={String(summary.submitted ?? 0)}
          />
          <StatCard
            description="Pendaftar sudah diverifikasi"
            icon={<UserCheck className="h-5 w-5" />}
            title={STATUS_LABEL.verified ?? "Terverifikasi"}
            tone="emerald"
            value={String(summary.verified ?? 0)}
          />
          <StatCard
            description="Pendaftar diterima"
            icon={<UserPlus className="h-5 w-5" />}
            title={STATUS_LABEL.accepted ?? "Diterima"}
            tone="emerald"
            value={String(summary.accepted ?? 0)}
          />
          <StatCard
            description="Pendaftar ditolak"
            icon={<UserMinus className="h-5 w-5" />}
            title={STATUS_LABEL.rejected ?? "Ditolak"}
            tone="amber"
            value={String(summary.rejected ?? 0)}
          />
          <StatCard
            description="Pendaftar dikonversi ke siswa"
            icon={<UserX className="h-5 w-5" />}
            title={STATUS_LABEL.converted ?? "Dikonversi"}
            tone="blue"
            value={String(summary.converted ?? 0)}
          />
          <StatCard
            description="Periode PPDB yang sedang aktif"
            icon={<Users className="h-5 w-5" />}
            title="Periode Aktif"
            tone="violet"
            value={String(summary.activePeriods ?? summary.activePeriod ?? 0)}
          />
        </div>
      ) : null}
    </div>
  );
}
