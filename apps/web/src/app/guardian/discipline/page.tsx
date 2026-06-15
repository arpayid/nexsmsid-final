"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { DataTable, EmptyState, ErrorState, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";

import type { StudentDisciplinePortalSummary } from "@nexsmsid/api-client";

import { ChildSelector } from "@/components/child-selector";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function GuardianDisciplinePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [childId, setChildId] = useState<string | null>(null);

  const loadSummary = useCallback(() => api.getGuardianPortalChildDiscipline(childId as string), [api, childId]);
  const {
    data: summary,
    error,
    loading,
  } = useApiQuery<StudentDisciplinePortalSummary>(loadSummary, [api, childId], {
    enabled: Boolean(childId),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Wali", "Kedisiplinan"]}
        description="Ringkasan poin pelanggaran confirmed dan prestasi anak yang dipilih."
        eyebrow="Portal Wali"
        title="Kedisiplinan Anak"
      />
      <ChildSelector onChange={setChildId} />
      {!childId ? (
        <EmptyState description="Pilih anak terlebih dahulu." title="Pilih anak" />
      ) : loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorState message={error} title="Gagal memuat kedisiplinan" />
      ) : !summary ? (
        <EmptyState description="Belum ada data discipline untuk anak ini." title="Data kosong" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Poin Pelanggaran" value={summary.totalViolationPoints ?? 0} />
            <MetricCard label="Poin Prestasi" value={summary.totalAchievementPoints ?? 0} />
            <MetricCard label="Saldo Poin" value={summary.netPoints ?? 0} />
          </div>
          <SectionCard description={summary.student?.name ?? "Anak"} title="Pelanggaran Terkonfirmasi">
            <DataTable
              columns={[
                { key: "incidentDate", header: "Tanggal", cell: (row) => formatDate(row.incidentDate) },
                { key: "rule", header: "Aturan", cell: (row) => row.rule?.name ?? "-" },
                { key: "severity", header: "Severity", cell: (row) => <StatusBadge value={row.rule?.severity ?? "-"} /> },
                { key: "point", header: "Poin" },
              ]}
              data={summary.latestViolations ?? []}
              getRowId={(row, index) => String(row.id ?? index)}
              minWidth="min-w-[680px]"
            />
          </SectionCard>
          <SectionCard description={summary.student?.name ?? "Anak"} title="Prestasi">
            <DataTable
              columns={[
                { key: "awardedAt", header: "Tanggal", cell: (row) => formatDate(row.awardedAt) },
                { key: "title", header: "Prestasi" },
                { key: "category", header: "Kategori" },
                { key: "point", header: "Poin" },
              ]}
              data={summary.latestAchievements ?? []}
              getRowId={(row, index) => String(row.id ?? index)}
              minWidth="min-w-[680px]"
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
