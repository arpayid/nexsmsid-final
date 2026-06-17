"use client";

import { useCallback, useMemo } from "react";
import { CreditCard, DollarSign, Loader2, Percent, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, ErrorState, PageHeader, StatCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type FinanceDashboardSummary = {
  totalInvoice?: number;
  collectedPayments?: number;
  pendingPayments?: number;
  outstandingAmount?: number;
  totalExpenses?: number;
  netIncome?: number;
};

export default function FinancePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.financeSummary() as Promise<FinanceDashboardSummary>, [api]);
  const { data: summary, error, loading, refetch } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Admin", "Keuangan"]}
        description="Ringkasan dan statistik keuangan sekolah."
        eyebrow="Keuangan"
        title="Dashboard Keuangan"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat dashboard keuangan" /> : null}

      {loading ? (
        <Card>
          <CardContent>
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat data keuangan...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            description="Total seluruh invoice yang diterbitkan"
            icon={<DollarSign className="h-5 w-5" />}
            title="Total Invoice"
            tone="teal"
            value={`Rp ${Number(summary.totalInvoice ?? 0).toLocaleString("id-ID")}`}
          />
          <StatCard
            description="Pembayaran yang sudah diterima"
            icon={<CreditCard className="h-5 w-5" />}
            title="Pembayaran Terkumpul"
            tone="emerald"
            value={`Rp ${Number(summary.collectedPayments ?? 0).toLocaleString("id-ID")}`}
          />
          <StatCard
            description="Pembayaran yang masih menunggu"
            icon={<Loader2 className="h-5 w-5" />}
            title="Pembayaran Tertunda"
            tone="amber"
            value={`Rp ${Number(summary.pendingPayments ?? 0).toLocaleString("id-ID")}`}
          />
          <StatCard
            description="Sisa tagihan yang belum dibayar"
            icon={<Percent className="h-5 w-5" />}
            title="Jumlah Outstanding"
            tone="amber"
            value={`Rp ${Number(summary.outstandingAmount ?? 0).toLocaleString("id-ID")}`}
          />
          <StatCard
            description="Total pengeluaran sekolah"
            icon={<TrendingDown className="h-5 w-5" />}
            title="Total Pengeluaran"
            tone="indigo"
            value={`Rp ${Number(summary.totalExpenses ?? 0).toLocaleString("id-ID")}`}
          />
          <StatCard
            description="Pemasukan bersih setelah pengeluaran"
            icon={<TrendingUp className="h-5 w-5" />}
            title="Pendapatan Bersih"
            tone={Number(summary.netIncome ?? 0) >= 0 ? "emerald" : "amber"}
            value={`Rp ${Number(summary.netIncome ?? 0).toLocaleString("id-ID")}`}
          />
        </div>
      ) : null}
    </div>
  );
}
