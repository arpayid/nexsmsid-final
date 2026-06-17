"use client";

import { BarChart3, BookOpen, GraduationCap, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";

import { Button, ErrorState, PageHeader, SectionCard, StatCard, StatusBadge } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamSummary = {
  total?: number;
  totalExams?: number;
  totalQuestions?: number;
  totalParticipants?: number;
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
};

export default function ExamReportsPage() {
  const client = useMemo(() => createBrowserApiClient(), []);

  const loadSummary = useCallback(() => client.getExamSummary(), [client]);
  const { data: summary, error, loading, refetch } = useApiQuery<ExamSummary>(loadSummary, [client]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => void refetch()} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
          </Button>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Laporan"]}
        description="Ringkasan dan laporan ujian."
        title="Laporan Ujian / CBT"
      />

      {error ? <ErrorState message={error} title="Gagal memuat laporan" /> : null}
      {loading ? <div className="py-20 text-center text-muted-foreground">Memuat ringkasan...</div> : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              title="Total Ujian"
              tone="violet"
              value={String(summary.totalExams ?? summary.total ?? 0)}
            />
            <StatCard icon={<BookOpen className="h-5 w-5" />} title="Total Soal" tone="blue" value={String(summary.totalQuestions ?? 0)} />
            <StatCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Total Peserta"
              tone="emerald"
              value={String(summary.totalParticipants ?? 0)}
            />
          </div>

          {summary.byStatus ? (
            <SectionCard title="Ujian per Status">
              <div className="flex flex-wrap gap-3">
                {Object.entries(summary.byStatus).map(([status, count]) => (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3" key={status}>
                    <StatusBadge value={status} />
                    <span className="text-lg font-bold">{count as number}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {summary.byType ? (
            <SectionCard title="Ujian per Tipe">
              <div className="flex flex-wrap gap-3">
                {Object.entries(summary.byType).map(([type, count]) => (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3" key={type}>
                    <span className="text-sm font-bold text-muted-foreground">{type}</span>
                    <span className="text-lg font-bold">{count as number}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/exams">
                <GraduationCap className="h-4 w-4" /> Lihat Semua Ujian
              </Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
