"use client";

import { useCallback, useMemo } from "react";
import {
  AlertCircle,
  Building2,
  ClipboardCheck,
  BriefcaseBusiness,
  Settings,
  HeartHandshake,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";

import { Card, CardContent, PageHeader, StatCard, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type InventorySummary = {
  totalItems?: number;
  activeAssets?: number;
  damagedAssets?: number;
  inMaintenance?: number;
  borrowedLoans?: number;
  lowStockItems?: number;
};

export default function InventoryDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.getInventorySummary() as Promise<InventorySummary>, [api]);
  const { data: summary, error, loading } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "Inventaris", "Dashboard"]}
        description="Ringkasan aset, barang, dan pemeliharaan sarana prasarana sekolah."
        eyebrow="Sarpras"
        title="Dashboard Inventaris"
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
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat ringkasan inventaris...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            description="Total semua barang & aset tercatat"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="Total Barang/Aset"
            tone="blue"
            value={String(summary.totalItems ?? 0)}
          />
          <StatCard
            description="Aset yang sedang berstatus ACTIVE"
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Aset Aktif"
            tone="emerald"
            value={String(summary.activeAssets ?? 0)}
          />
          <StatCard
            description="Aset rusak (DAMAGED / HEAVILY_DAMAGED)"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Aset Rusak"
            tone="amber"
            value={String(summary.damagedAssets ?? 0)}
          />
          <StatCard
            description="Aset dalam pemeliharaan (MAINTENANCE)"
            icon={<Settings className="h-5 w-5" />}
            title="Sedang Pemeliharaan"
            tone="amber"
            value={String(summary.inMaintenance ?? 0)}
          />
          <StatCard
            description="Barang yang sedang dipinjam (BORROWED)"
            icon={<HeartHandshake className="h-5 w-5" />}
            title="Dipinjam"
            tone="violet"
            value={String(summary.borrowedLoans ?? 0)}
          />
          <StatCard
            description="Barang dengan kuantitas <= stok minimum"
            icon={<AlertCircle className="h-5 w-5" />}
            title="Stok Menipis / Habis"
            tone="amber"
            value={String(summary.lowStockItems ?? 0)}
          />
        </div>
      ) : null}
    </div>
  );
}
