"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, FileText, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button, ErrorState, PageHeader, SectionCard, StatCard } from "@nexsmsid/ui";

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

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/reports">Report Center</Link>
            </Button>
          </>
        }
        breadcrumb={["Admin", "Perpustakaan", "Laporan"]}
        description="Ringkasan aktivitas perpustakaan dan ekspor data."
        eyebrow="Perpustakaan"
        title="Laporan Perpustakaan"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat laporan perpustakaan" /> : null}

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description="Terdaftar"
          icon={<FileText className="h-5 w-5" />}
          title="Total Buku"
          tone="violet"
          value={loading ? "…" : String(summary?.totalBooks ?? "—")}
        />
        <StatCard
          description="Tersedia"
          icon={<FileText className="h-5 w-5" />}
          title="Eksemplar"
          tone="blue"
          value={loading ? "…" : String(summary?.totalCopies ?? "—")}
        />
        <StatCard
          description="Sedang dipinjam"
          icon={<FileText className="h-5 w-5" />}
          title="Peminjaman Aktif"
          tone="emerald"
          value={loading ? "…" : String(summary?.activeLoans ?? "—")}
        />
        <StatCard
          description="Total anggota"
          icon={<FileText className="h-5 w-5" />}
          title="Anggota"
          tone="amber"
          value={loading ? "…" : String(summary?.totalMembers ?? "—")}
        />
      </div>

      <SectionCard description="Unduh rekap data perpustakaan dalam format XLSX atau PDF." title="Export Data">
        <div className="flex flex-wrap gap-3">
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
        </div>
      </SectionCard>
    </div>
  );
}
