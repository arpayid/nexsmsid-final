"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, RefreshCcw, XCircle } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryFine = {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  member?: { student?: { name?: string }; externalName?: string; memberCode?: string };
  loan?: { copy?: { book?: { title?: string } } };
};

export default function LibraryFinesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadFines = useCallback(async () => {
    const res = (await api.listLibraryFines({ limit: 100 })) as { data?: LibraryFine[] };
    return res.data ?? [];
  }, [api]);
  const { data: finesData, error, loading, refetch, setError } = useApiQuery<LibraryFine[]>(loadFines, [api]);
  const fines = finesData ?? [];

  async function runAction(id: string, action: "pay" | "waive" | "cancel") {
    if (
      !window.confirm(`Yakin ingin ${action === "pay" ? "menandai lunas" : action === "waive" ? "membebaskan" : "membatalkan"} denda ini?`)
    ) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      if (action === "pay") await api.payLibraryFine(id, {});
      if (action === "waive") await api.waiveLibraryFine(id, {});
      if (action === "cancel") await api.cancelLibraryFine(id);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses denda");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        }
        breadcrumb={["Admin", "Perpustakaan", "Denda"]}
        description="Pantau dan kelola denda keterlambatan peminjaman buku."
        eyebrow="Perpustakaan"
        title="Denda"
      />
      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : fines.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-muted-foreground">
            <p>Tidak ada data denda.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-semibold">Anggota</th>
                <th className="p-4 text-left font-semibold">Buku</th>
                <th className="p-4 text-left font-semibold">Jumlah</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Tanggal</th>
                <th className="p-4 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr className="border-b last:border-0 hover:bg-muted/30" key={fine.id}>
                  <td className="p-4">{fine.member?.student?.name ?? fine.member?.externalName ?? fine.member?.memberCode ?? "-"}</td>
                  <td className="p-4">{fine.loan?.copy?.book?.title ?? "-"}</td>
                  <td className="p-4 font-semibold">Rp {Number(fine.amount || 0).toLocaleString("id-ID")}</td>
                  <td className="p-4">
                    <StatusBadge value={fine.status || "UNPAID"} />
                  </td>
                  <td className="p-4">{fine.createdAt ? new Date(fine.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                  <td className="p-4">
                    {fine.status === "UNPAID" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={busyId === fine.id} onClick={() => void runAction(fine.id, "pay")} size="sm" variant="outline">
                          {busyId === fine.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Bayar
                        </Button>
                        <Button disabled={busyId === fine.id} onClick={() => void runAction(fine.id, "waive")} size="sm" variant="ghost">
                          Bebaskan
                        </Button>
                        <Button disabled={busyId === fine.id} onClick={() => void runAction(fine.id, "cancel")} size="sm" variant="ghost">
                          <XCircle className="h-4 w-4" /> Batal
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Selesai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
