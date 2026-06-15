"use client";

import { useCallback, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, FileText, Loader2, Send, Archive } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle, DataTable, ErrorState, PageHeader, StatCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Row = Record<string, unknown>;

const reportTypes = [
  { code: "letter-recap", title: "Semua Surat" },
  { code: "outgoing-letter-recap", title: "Surat Keluar" },
  { code: "incoming-letter-recap", title: "Surat Masuk" },
  { code: "letter-approval-recap", title: "Approval Surat" },
];

type LetterReportsData = {
  summary: Row;
  recentIssued: Row[];
};

export default function LetterReportsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [generating, setGenerating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [summaryData, letters] = await Promise.all([api.getLetterSummary(), api.listLetters({ limit: 5, status: "ISSUED" })]);
    return { summary: summaryData as Row, recentIssued: letters.items as Row[] };
  }, [api]);
  const { data, error: fetchError, loading } = useApiQuery<LetterReportsData>(loadData, [api]);
  const error = actionError ?? fetchError;
  const summary = data?.summary;
  const recentIssued = data?.recentIssued ?? [];

  async function generate(type: string) {
    setGenerating(type);
    setActionError(null);
    try {
      await api.generateReport({ type, format: "XLSX", title: `${type} - ${new Date().toLocaleDateString("id-ID")}`, parameters: {} });
    } catch (generateError) {
      setActionError(generateError instanceof Error ? generateError.message : "Gagal generate report surat");
    } finally {
      setGenerating(null);
    }
  }

  const byStatus = (summary?.byStatus ?? {}) as Record<string, number>;

  const columns: DataTableColumn<Row>[] = [
    { key: "letterNumber", header: "Nomor", cell: (row) => String(row.letterNumber ?? "-") },
    { key: "subject", header: "Perihal", cell: (row) => String(row.subject ?? "-") },
    { key: "category", header: "Kategori", cell: (row) => String(row.category ?? "-") },
    { key: "recipientName", header: "Penerima", cell: (row) => String(row.recipientName ?? "-") },
    { key: "issuedAt", header: "Terbit", cell: (row) => formatDate(row.issuedAt) },
  ];

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        breadcrumb={["Admin", "Surat Menyurat", "Rekap Surat"]}
        description="Ringkasan status surat, surat terbit terbaru, dan integrasi Report Center."
        eyebrow="Surat Menyurat"
        title="Rekap Surat"
      />

      {error ? <ErrorState message={error} title="Gagal memproses rekap" /> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          description="Semua surat"
          icon={<BarChart3 className="h-5 w-5" />}
          title="Total"
          tone="violet"
          value={loading ? "..." : String(summary?.total ?? 0)}
        />
        <StatCard
          description="Draft"
          icon={<FileText className="h-5 w-5" />}
          title="Draft"
          tone="blue"
          value={loading ? "..." : String(byStatus.draft ?? 0)}
        />
        <StatCard
          description="Menunggu"
          icon={<Send className="h-5 w-5" />}
          title="Submitted"
          tone="blue"
          value={loading ? "..." : String(byStatus.submitted ?? 0)}
        />
        <StatCard
          description="Disetujui"
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Approved"
          tone="emerald"
          value={loading ? "..." : String(byStatus.approved ?? 0)}
        />
        <StatCard
          description="Diterbitkan"
          icon={<FileText className="h-5 w-5" />}
          title="Issued"
          tone="emerald"
          value={loading ? "..." : String(byStatus.issued ?? 0)}
        />
        <StatCard
          description="Diarsipkan"
          icon={<Archive className="h-5 w-5" />}
          title="Archived"
          tone="violet"
          value={loading ? "..." : String(byStatus.archived ?? 0)}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Surat Terbit Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={recentIssued}
              getRowId={(row) => row.id as string}
              loading={loading}
              minWidth="min-w-[760px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportTypes.map((report) => (
              <Button
                className="w-full justify-start"
                disabled={Boolean(generating)}
                key={report.code}
                onClick={() => void generate(report.code)}
                variant="outline"
              >
                {generating === report.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {report.title} XLSX
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
