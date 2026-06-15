"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function LibraryReportsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadSummary = useCallback(() => api.getLibrarySummary(), [api]);
  const { data: summary, error: fetchError, loading, refetch } = useApiQuery(loadSummary, [api]);
  const error = actionError ?? fetchError;

  async function handleExport(type: string, label: string, format: string) {
    setBusy(type);
    setActionError(null);
    setMessage(null);
    try {
      await api.generateReport({
        type,
        format,
        title: `${label} — ${new Date().toLocaleDateString("id-ID")}`,
        parameters: {},
      });
      setMessage(`Laporan "${label}" masuk antrian. Pantau di Report Jobs.`);
    } catch (exportError) {
      setActionError(exportError instanceof Error ? exportError.message : "Gagal membuat laporan");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/reports">Report Center</Link>
          </Button>
        }
        breadcrumb={["Admin", "Perpustakaan", "Laporan"]}
        description="Ringkasan aktivitas perpustakaan dan ekspor data."
        eyebrow="Perpustakaan"
        title="Laporan Perpustakaan"
      />
      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description="Terdaftar"
          icon={<FileText className="h-5 w-5" />}
          title="Total Buku"
          value={String(summary?.totalBooks ?? "—")}
          tone="violet"
        />
        <StatCard
          description="Tersedia"
          icon={<FileText className="h-5 w-5" />}
          title="Eksemplar"
          value={String(summary?.totalCopies ?? "—")}
          tone="blue"
        />
        <StatCard
          description="Sedang dipinjam"
          icon={<FileText className="h-5 w-5" />}
          title="Peminjaman Aktif"
          value={String(summary?.activeLoans ?? "—")}
          tone="emerald"
        />
        <StatCard
          description="Total anggota"
          icon={<FileText className="h-5 w-5" />}
          title="Anggota"
          value={String(summary?.totalMembers ?? "—")}
          tone="amber"
        />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Export Data</CardTitle>
          <Button onClick={() => void refetch()} size="sm" variant="outline">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            disabled={busy === "library-book-recap"}
            onClick={() => void handleExport("library-book-recap", "Rekap Buku", "XLSX")}
            variant="outline"
          >
            {busy === "library-book-recap" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Buku
            (XLSX)
          </Button>
          <Button
            disabled={busy === "library-member-recap"}
            onClick={() => void handleExport("library-member-recap", "Rekap Anggota", "XLSX")}
            variant="outline"
          >
            {busy === "library-member-recap" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export
            Anggota (XLSX)
          </Button>
          <Button
            disabled={busy === "library-loan-recap"}
            onClick={() => void handleExport("library-loan-recap", "Rekap Peminjaman", "PDF")}
            variant="outline"
          >
            {busy === "library-loan-recap" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Cetak
            Peminjaman (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
