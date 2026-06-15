"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, BarChart3, ListFilter, PlayCircle } from "lucide-react";
import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LowStockItemRow = {
  id: string;
  name?: string;
  code?: string;
  quantity?: number;
  unit?: string;
  minStock?: number;
  category?: { name?: string };
};

type OverdueLoanRow = {
  id: string;
  borrowerName?: string;
  quantity?: number;
  dueAt?: string;
  item?: { name?: string };
};

type MaintenanceDueRow = {
  id: string;
  title?: string;
  scheduledAt?: string;
  item?: { name?: string };
};

type InventoryReportsData = {
  summary: Record<string, unknown>;
  lowStock: LowStockItemRow[];
  overdueLoans: OverdueLoanRow[];
  maintenanceDue: MaintenanceDueRow[];
};

export default function InventoryReportsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [printing, setPrinting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadReports = useCallback(async () => {
    const [sumRes, lowRes, overdueRes, maintRes] = await Promise.all([
      api.getInventorySummary(),
      api.getInventoryLowStock(),
      api.getInventoryLoansOverdue(),
      api.getInventoryMaintenanceDue(),
    ]);
    return {
      summary: sumRes,
      lowStock: (lowRes as { data?: LowStockItemRow[] }).data ?? [],
      overdueLoans: (overdueRes as { data?: OverdueLoanRow[] }).data ?? [],
      maintenanceDue: (maintRes as { data?: MaintenanceDueRow[] }).data ?? [],
    };
  }, [api]);
  const { data, error: fetchError, loading } = useApiQuery<InventoryReportsData>(loadReports, [api]);
  const error = actionError ?? fetchError;
  const summary = data?.summary;
  const lowStock = data?.lowStock ?? [];
  const overdueLoans = data?.overdueLoans ?? [];
  const maintenanceDue = data?.maintenanceDue ?? [];

  async function handlePrintSummary() {
    setActionError(null);
    setPrinting(true);
    try {
      await api.downloadInventorySummaryPdf();
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "Gagal membuat PDF ringkasan");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button disabled={printing} onClick={handlePrintSummary} variant="outline">
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Cetak Ringkasan PDF
          </Button>
        }
        breadcrumb={["Admin", "Inventaris", "Laporan & Peringatan"]}
        description="Ringkasan eksekutif, peringatan stok, dan akses ke pembuat laporan."
        eyebrow="Sarpras"
        title="Laporan & Peringatan"
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
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat laporan...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-rose-200 bg-rose-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="h-5 w-5" /> Stok Menipis / Habis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length ? (
                <ul className="space-y-3">
                  {lowStock.map((item) => (
                    <li key={item.id} className="flex justify-between items-center rounded-xl bg-card p-3 shadow-sm border border-rose-100">
                      <div>
                        <p className="font-bold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Kategori: {item.category?.name ?? "-"} | Kode: {item.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-rose-600">
                          {item.quantity} {item.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">Min: {item.minStock ?? 0}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">Tidak ada barang dengan stok menipis.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <ListFilter className="h-5 w-5" /> Peminjaman Terlambat (Overdue)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueLoans.length ? (
                <ul className="space-y-3">
                  {overdueLoans.map((loan) => (
                    <li
                      key={loan.id}
                      className="flex justify-between items-center rounded-xl bg-card p-3 shadow-sm border border-amber-100"
                    >
                      <div>
                        <p className="font-bold text-foreground">{loan.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {loan.item?.name} ({loan.quantity} unit)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">{loan.dueAt ? new Date(loan.dueAt).toLocaleDateString("id-ID") : "-"}</p>
                        <p className="text-xs text-muted-foreground">Jatuh Tempo</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">Tidak ada peminjaman yang terlambat.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <PlayCircle className="h-5 w-5" /> Pemeliharaan Mendatang / Jatuh Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceDue.length ? (
                <ul className="space-y-3">
                  {maintenanceDue.map((maint) => (
                    <li
                      key={maint.id}
                      className="flex justify-between items-center rounded-xl bg-card p-3 shadow-sm border border-blue-100"
                    >
                      <div>
                        <p className="font-bold text-foreground">{maint.title}</p>
                        <p className="text-xs text-muted-foreground">{maint.item?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {maint.scheduledAt ? new Date(maint.scheduledAt).toLocaleDateString("id-ID") : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">Jadwal</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">Tidak ada jadwal pemeliharaan terdekat.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Report Center Inventaris
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Untuk mencetak laporan lengkap (Excel, CSV, PDF) berdasarkan periode tertentu, gunakan fitur Report Center utama kami.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Laporan Rekap Barang/Aset
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Laporan Rekap Mutasi
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Laporan Rekap Pemeliharaan
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Laporan Rekap Peminjaman
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Laporan Barang Stok Menipis
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/admin/reports">Buka Report Center Utama</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
