"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Plus, Printer, RefreshCcw, Trash2, Loader2, CheckCircle2, XCircle, ArrowRightCircle, Undo2, X } from "lucide-react";

import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormModal,
  Input,
  PageHeader,
  SearchFilterBar,
  SectionCard,
  StatusBadge,
} from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";

type InventoryLoanRow = {
  id: string;
  itemId?: string;
  borrowerName?: string;
  borrowerType?: string;
  quantity?: number;
  purpose?: string;
  dueAt?: string;
  note?: string;
  status?: string;
  item?: { name?: string };
};

type StatusMapEntry = {
  label: string;
  variant: "success" | "warning" | "info" | "secondary" | "outline";
};

type LoanConfirmAction = "approve" | "reject" | "borrow" | "return" | "cancel" | "delete";

const LOAN_STATUS_MAP: Record<string, StatusMapEntry> = {
  REQUESTED: { label: "Menunggu Persetujuan", variant: "outline" },
  APPROVED: { label: "Disetujui", variant: "info" },
  REJECTED: { label: "Ditolak", variant: "secondary" },
  BORROWED: { label: "Dipinjam", variant: "warning" },
  RETURNED: { label: "Dikembalikan", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
  OVERDUE: { label: "Jatuh Tempo / Terlambat", variant: "warning" },
};

const CONFIRM_COPY: Record<LoanConfirmAction, { description: string; title: string }> = {
  approve: { description: "Setujui permintaan peminjaman ini?", title: "Konfirmasi persetujuan" },
  reject: { description: "Tolak permintaan peminjaman ini?", title: "Konfirmasi penolakan" },
  borrow: { description: "Tandai barang sebagai sedang dipinjam?", title: "Konfirmasi peminjaman" },
  return: { description: "Tandai barang sebagai sudah dikembalikan?", title: "Konfirmasi pengembalian" },
  cancel: { description: "Batalkan peminjaman ini?", title: "Konfirmasi pembatalan" },
  delete: { description: "Hapus data peminjaman ini? Tindakan tidak dapat dibatalkan.", title: "Konfirmasi hapus" },
};

const SELECT_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function InventoryLoansPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryLoanRow | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: LoanConfirmAction; item: InventoryLoanRow } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    const response = await api.getInventoryLoans({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryLoanRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<InventoryLoanRow[]>(loadLoans, [api, appliedSearch]);
  const items = itemsData ?? [];
  const total = items.length;
  const error = actionError ?? fetchError;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryLoanRow) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    try {
      if (action === "approve") await api.approveInventoryLoan(item.id);
      else if (action === "reject") await api.rejectInventoryLoan(item.id);
      else if (action === "borrow") await api.markInventoryLoanBorrowed(item.id);
      else if (action === "return") await api.returnInventoryLoan(item.id);
      else if (action === "cancel") await api.cancelInventoryLoan(item.id);
      else await api.deleteInventoryLoan(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Gagal memproses aksi peminjaman`);
    }
  }

  async function handlePrint(item: InventoryLoanRow) {
    setActionError(null);
    setPrintingId(item.id);
    try {
      await api.downloadInventoryLoanPdf(item.id);
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "Gagal membuat PDF peminjaman");
    } finally {
      setPrintingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);

    const payload: Record<string, unknown> = {
      itemId: formData.get("itemId"),
      borrowerName: formData.get("borrowerName"),
      borrowerType: formData.get("borrowerType"),
      quantity: Number(formData.get("quantity") || 1),
      purpose: formData.get("purpose") || undefined,
      dueAt: formData.get("dueAt") ? new Date(formData.get("dueAt") as string).toISOString() : undefined,
      note: formData.get("note") || undefined,
    };

    try {
      if (editing) {
        await api.updateInventoryLoan(editing.id, payload);
      } else {
        await api.createInventoryLoan(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan peminjaman");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<InventoryLoanRow>[] = [
    { cell: (item) => item.item?.name ?? "-", header: "Barang", key: "item" },
    {
      cell: (item) => (
        <>
          {item.borrowerName ?? "-"}
          <br />
          <span className="text-xs text-muted-foreground">{item.borrowerType}</span>
        </>
      ),
      header: "Peminjam",
      key: "borrower",
    },
    { cell: (item) => item.quantity ?? "-", header: "Jumlah", key: "quantity" },
    {
      cell: (item) => (item.dueAt ? new Date(item.dueAt).toLocaleDateString("id-ID") : "-"),
      header: "Batas Waktu",
      key: "dueAt",
    },
    {
      cell: (item) => <StatusBadge map={LOAN_STATUS_MAP} value={item.status} />,
      header: "Status",
      key: "status",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Form Peminjaman
            </Button>
          </>
        }
        breadcrumb={["Admin", "Inventaris", "Peminjaman"]}
        description="Kelola proses peminjaman barang, persetujuan, dan pengembalian."
        eyebrow="Sarpras"
        title="Peminjaman Barang"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses peminjaman" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari peminjam..." searchValue={search} />
        }
        description={
          <>
            Riwayat peminjaman barang. Total: <strong>{total}</strong> data.
          </>
        }
        title="Riwayat Peminjaman"
      >
        <DataTable
          actions={(item) => (
            <>
              {item.status === "REQUESTED" ? (
                <>
                  <Button onClick={() => setPendingConfirm({ action: "approve", item })} size="sm" variant="soft" aria-label="Setujui">
                    <CheckCircle2 className="h-4 w-4" /> Setujui
                  </Button>
                  <Button onClick={() => setPendingConfirm({ action: "reject", item })} size="sm" variant="outline" aria-label="Tolak">
                    <XCircle className="h-4 w-4" /> Tolak
                  </Button>
                  <Button onClick={() => openEdit(item)} size="sm" variant="outline" aria-label="Edit">
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                </>
              ) : null}

              {item.status === "APPROVED" ? (
                <Button onClick={() => setPendingConfirm({ action: "borrow", item })} size="sm" variant="soft" aria-label="Tandai Dipinjam">
                  <ArrowRightCircle className="h-4 w-4" /> Dipinjam
                </Button>
              ) : null}

              {item.status === "BORROWED" || item.status === "OVERDUE" ? (
                <Button onClick={() => setPendingConfirm({ action: "return", item })} size="sm" variant="soft" aria-label="Dikembalikan">
                  <Undo2 className="h-4 w-4" /> Kembali
                </Button>
              ) : null}

              {item.status === "REQUESTED" || item.status === "APPROVED" ? (
                <Button onClick={() => setPendingConfirm({ action: "cancel", item })} size="sm" variant="ghost" aria-label="Batal">
                  <X className="h-4 w-4" /> Batal
                </Button>
              ) : null}

              <Button
                disabled={printingId === item.id}
                onClick={() => void handlePrint(item)}
                size="sm"
                variant="soft"
                aria-label="Cetak Surat Peminjaman"
              >
                {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} PDF
              </Button>

              <Button onClick={() => setPendingConfirm({ action: "delete", item })} size="sm" variant="ghost" aria-label="Hapus">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Buat form peminjaman pertama
              </Button>
            ),
            description: "Belum ada data peminjaman atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi detail permintaan peminjaman barang."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={`${editing ? "Edit" : "Form"} Peminjaman`}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Pilih Barang</span>
            <EntityPicker
              defaultValue={editing?.itemId ?? ""}
              entityType="inventory-item"
              name="itemId"
              placeholder="Cari barang..."
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Tipe Peminjam</span>
              <select className={SELECT_CLASS} defaultValue={editing?.borrowerType ?? "STUDENT"} name="borrowerType" required>
                <option value="STUDENT">Siswa</option>
                <option value="TEACHER">Guru</option>
                <option value="STAFF">Staff</option>
                <option value="EXTERNAL">Eksternal</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Nama Lengkap Peminjam</span>
              <Input defaultValue={editing?.borrowerName ?? ""} name="borrowerName" required />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Tanggal Jatuh Tempo</span>
              <Input
                defaultValue={editing?.dueAt ? new Date(editing.dueAt).toISOString().split("T")[0] : ""}
                name="dueAt"
                type="date"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Jumlah Barang</span>
              <Input defaultValue={editing?.quantity ?? "1"} name="quantity" type="number" min="1" required />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Keperluan Peminjaman</span>
            <Input defaultValue={editing?.purpose ?? ""} name="purpose" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Catatan Tambahan</span>
            <textarea className={SELECT_CLASS} defaultValue={editing?.note ?? ""} name="note" rows={2} />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        description={pendingConfirm ? CONFIRM_COPY[pendingConfirm.action].description : ""}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmAction()}
        open={Boolean(pendingConfirm)}
        title={pendingConfirm ? CONFIRM_COPY[pendingConfirm.action].title : "Konfirmasi"}
      />
    </div>
  );
}
