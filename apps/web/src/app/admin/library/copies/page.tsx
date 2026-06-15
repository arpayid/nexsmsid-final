"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Loader2, RefreshCcw, Barcode } from "lucide-react";
import { Button, Card, Input, PageHeader, StatusBadge } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryCopyRow = {
  id: string;
  code?: string | null;
  status?: string | null;
  condition?: string | null;
  book?: { title?: string };
  shelf?: { name?: string };
};

export default function LibraryCopiesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadCopies = useCallback(async () => {
    const res = await api.listAllCopies({ limit: 100, search });
    return res.data ?? [];
  }, [api, search]);
  const { data: copiesData, error: fetchError, loading, refetch } = useApiQuery<LibraryCopyRow[]>(loadCopies, [search]);
  const copies = copiesData ?? [];
  const error = actionError ?? fetchError;

  async function handlePrintLabel(copyId: string) {
    setActionError(null);
    setPrintingId(copyId);
    try {
      await api.downloadLibraryCopyLabelPdf(copyId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal mencetak label");
    } finally {
      setPrintingId(null);
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
        breadcrumb={["Admin", "Perpustakaan", "Eksemplar"]}
        description="Kelola eksemplar buku dan cetak barcode."
        eyebrow="Perpustakaan"
        title="Eksemplar Buku"
      />
      <div className="flex gap-2">
        <Input className="max-w-xs" onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau judul..." value={search} />
      </div>
      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : copies.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-muted-foreground">
            <p>Tidak ada data eksemplar.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-semibold">Kode</th>
                <th className="p-4 text-left font-semibold">Judul Buku</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Kondisi</th>
                <th className="p-4 text-left font-semibold">Lokasi</th>
                <th className="p-4 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {copies.map((copy) => (
                <tr className="border-b last:border-0 hover:bg-muted/30" key={copy.id}>
                  <td className="p-4 font-mono text-xs">{copy.code || "-"}</td>
                  <td className="p-4">{copy.book?.title || "-"}</td>
                  <td className="p-4">
                    <StatusBadge value={copy.status || "AVAILABLE"} />
                  </td>
                  <td className="p-4">{copy.condition || "GOOD"}</td>
                  <td className="p-4">{copy.shelf?.name || "-"}</td>
                  <td className="p-4">
                    <Button disabled={printingId === copy.id} onClick={() => void handlePrintLabel(copy.id)} size="sm" variant="outline">
                      {printingId === copy.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />} Label
                    </Button>
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
