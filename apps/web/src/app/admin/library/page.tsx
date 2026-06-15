"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, BookOpen, Layers, Users, HeartHandshake, Loader2, AlertTriangle, Clock, Banknote } from "lucide-react";

import { Card, CardContent, PageHeader, StatCard, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibrarySummary = {
  totalBooks?: number;
  totalCopies?: number;
  availableCopies?: number;
  borrowedCopies?: number;
  overdueLoans?: number;
  unpaidFines?: number;
};

export default function LibraryDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.getLibrarySummary() as Promise<LibrarySummary>, [api]);
  const { data: summary, error, loading } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "Perpustakaan", "Dashboard"]}
        description="Ringkasan koleksi buku, sirkulasi peminjaman, dan denda perpustakaan."
        eyebrow="Perpustakaan"
        title="Dashboard Perpustakaan"
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
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat ringkasan perpustakaan...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            description="Total semua judul buku di perpustakaan"
            icon={<BookOpen className="h-5 w-5" />}
            title="Total Judul Buku"
            tone="blue"
            value={String(summary.totalBooks ?? 0)}
          />
          <StatCard
            description="Total seluruh eksemplar buku"
            icon={<Layers className="h-5 w-5" />}
            title="Total Eksemplar"
            tone="emerald"
            value={String(summary.totalCopies ?? 0)}
          />
          <StatCard
            description="Eksemplar yang tersedia untuk dipinjam"
            icon={<BookOpen className="h-5 w-5" />}
            title="Tersedia"
            tone="emerald"
            value={String(summary.availableCopies ?? 0)}
          />
          <StatCard
            description="Eksemplar yang sedang dipinjam"
            icon={<HeartHandshake className="h-5 w-5" />}
            title="Sedang Dipinjam"
            tone="violet"
            value={String(summary.borrowedCopies ?? 0)}
          />
          <StatCard
            description="Peminjaman yang terlambat dikembalikan"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Terlambat (Overdue)"
            tone="amber"
            value={String(summary.overdueLoans ?? 0)}
          />
          <StatCard
            description="Total denda keterlambatan yang belum dibayar"
            icon={<Banknote className="h-5 w-5" />}
            title="Denda Belum Dibayar"
            tone="amber"
            value={`Rp ${Number(summary.unpaidFines ?? 0).toLocaleString("id-ID")}`}
          />
        </div>
      ) : null}
    </div>
  );
}
