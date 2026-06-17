"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle, Loader2, RefreshCcw, XCircle } from "lucide-react";

import { Button, ConfirmDialog, DataTable, ErrorState, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

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

type FineConfirmAction = "pay" | "waive" | "cancel";

export default function LibraryFinesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: FineConfirmAction; item: LibraryFine } | null>(null);

  const loadFines = useCallback(async () => {
    const res = (await api.listLibraryFines({ limit: 100 })) as { data?: LibraryFine[] };
    return res.data ?? [];
  }, [api]);
  const { data: finesData, error: fetchError, loading, refetch } = useApiQuery<LibraryFine[]>(loadFines, [api]);
  const fines = finesData ?? [];
  const total = fines.length;
  const error = actionError ?? fetchError;

  const confirmCopy: Record<FineConfirmAction, { description: string; title: string }> = {
    pay: { description: "Tandai denda ini sebagai lunas?", title: "Konfirmasi pembayaran denda" },
    waive: { description: "Bebaskan denda ini dari kewajiban pembayaran?", title: "Konfirmasi pembebasan denda" },
    cancel: { description: "Batalkan denda ini? Tindakan tidak dapat dibatalkan.", title: "Konfirmasi batalkan denda" },
  };

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    setBusyId(item.id);
    try {
      if (action === "pay") await api.payLibraryFine(item.id, {});
      if (action === "waive") await api.waiveLibraryFine(item.id, {});
      if (action === "cancel") await api.cancelLibraryFine(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal memproses denda");
    } finally {
      setBusyId(null);
    }
  }

  const columns: DataTableColumn<LibraryFine>[] = [
    {
      cell: (item) => item.member?.student?.name ?? item.member?.externalName ?? item.member?.memberCode ?? "-",
      header: "Anggota",
      key: "member",
    },
    {
      cell: (item) => item.loan?.copy?.book?.title ?? "-",
      header: "Buku",
      key: "book",
    },
    {
      cell: (item) => `Rp ${Number(item.amount || 0).toLocaleString("id-ID")}`,
      header: "Jumlah",
      key: "amount",
    },
    {
      cell: (item) => <StatusBadge value={item.status || "UNPAID"} />,
      header: "Status",
      key: "status",
    },
    {
      cell: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "-"),
      header: "Tanggal",
      key: "createdAt",
    },
  ];

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

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses denda" /> : null}

      <SectionCard
        description={
          <>
            Daftar denda keterlambatan peminjaman. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Denda"
      >
        <DataTable
          actions={(fine) =>
            fine.status === "UNPAID" ? (
              <>
                <Button
                  disabled={busyId === fine.id}
                  onClick={() => setPendingConfirm({ action: "pay", item: fine })}
                  size="sm"
                  variant="soft"
                >
                  {busyId === fine.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Bayar
                </Button>
                <Button
                  disabled={busyId === fine.id}
                  onClick={() => setPendingConfirm({ action: "waive", item: fine })}
                  size="sm"
                  variant="outline"
                >
                  Bebaskan
                </Button>
                <Button
                  disabled={busyId === fine.id}
                  onClick={() => setPendingConfirm({ action: "cancel", item: fine })}
                  size="sm"
                  variant="ghost"
                >
                  <XCircle className="h-4 w-4" /> Batal
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Selesai</span>
            )
          }
          columns={columns}
          data={fines}
          emptyState={{
            description: "Belum ada data denda keterlambatan.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[800px]"
        />
      </SectionCard>

      <ConfirmDialog
        description={pendingConfirm ? confirmCopy[pendingConfirm.action].description : ""}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmAction()}
        open={Boolean(pendingConfirm)}
        title={pendingConfirm ? confirmCopy[pendingConfirm.action].title : "Konfirmasi"}
      />
    </div>
  );
}
