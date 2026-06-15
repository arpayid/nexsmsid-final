"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  Edit3,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  Undo2,
  X,
} from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader, StatusBadge } from "@nexsmsid/ui";
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

export default function InventoryLoansPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryLoanRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    const response = await api.getInventoryLoans({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryLoanRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<InventoryLoanRow[]>(loadLoans, [api, appliedSearch]);
  const items = itemsData ?? [];
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

  async function handleDelete(item: InventoryLoanRow) {
    if (!window.confirm("Hapus data peminjaman ini?")) return;
    setActionError(null);
    try {
      await api.deleteInventoryLoan(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus");
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

  async function handleAction(item: InventoryLoanRow, actionType: "approve" | "reject" | "borrow" | "return" | "cancel") {
    if (!window.confirm(`Yakin ingin melakukan aksi: ${actionType}?`)) return;
    setActionError(null);
    try {
      if (actionType === "approve") await api.approveInventoryLoan(item.id);
      if (actionType === "reject") await api.rejectInventoryLoan(item.id);
      if (actionType === "borrow") await api.markInventoryLoanBorrowed(item.id);
      if (actionType === "return") await api.returnInventoryLoan(item.id);
      if (actionType === "cancel") await api.cancelInventoryLoan(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Gagal melakukan aksi ${actionType}`);
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

  const LOAN_STATUS_MAP: Record<string, StatusMapEntry> = {
    REQUESTED: { label: "Menunggu Persetujuan", variant: "outline" },
    APPROVED: { label: "Disetujui", variant: "info" },
    REJECTED: { label: "Ditolak", variant: "secondary" },
    BORROWED: { label: "Dipinjam", variant: "warning" },
    RETURNED: { label: "Dikembalikan", variant: "success" },
    CANCELLED: { label: "Dibatalkan", variant: "secondary" },
    OVERDUE: { label: "Jatuh Tempo / Terlambat", variant: "warning" },
  };

  return (
    <div className="space-y-8">
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

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Riwayat Peminjaman</CardTitle>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari peminjam..."
                  value={search}
                />
              </div>
              <Button type="submit" variant="soft">
                Cari
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat data...
              </span>
            </div>
          ) : items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Barang</th>
                    <th className="px-4 py-3 font-semibold">Peminjam</th>
                    <th className="px-4 py-3 font-semibold">Jumlah</th>
                    <th className="px-4 py-3 font-semibold">Batas Waktu</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.item?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {item.borrowerName}
                        <br />
                        <span className="text-xs text-muted-foreground">{item.borrowerType}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {item.dueAt ? new Date(item.dueAt).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge map={LOAN_STATUS_MAP} value={item.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status === "REQUESTED" ? (
                            <>
                              <Button onClick={() => handleAction(item, "approve")} size="sm" variant="soft" aria-label="Setujui">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleAction(item, "reject")} size="sm" variant="outline" aria-label="Tolak">
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => openEdit(item)} size="sm" variant="outline" aria-label="Edit">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}

                          {item.status === "APPROVED" ? (
                            <Button onClick={() => handleAction(item, "borrow")} size="sm" variant="soft" aria-label="Tandai Dipinjam">
                              <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                          ) : null}

                          {item.status === "BORROWED" || item.status === "OVERDUE" ? (
                            <Button onClick={() => handleAction(item, "return")} size="sm" variant="soft" aria-label="Dikembalikan">
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          ) : null}

                          {item.status === "REQUESTED" || item.status === "APPROVED" ? (
                            <Button onClick={() => handleAction(item, "cancel")} size="sm" variant="ghost" aria-label="Batal">
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}

                          <Button
                            disabled={printingId === item.id}
                            onClick={() => handlePrint(item)}
                            size="sm"
                            variant="soft"
                            aria-label="Cetak Surat Peminjaman"
                          >
                            {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                          </Button>

                          <Button onClick={() => handleDelete(item)} size="sm" variant="ghost" aria-label="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={openCreate} variant="soft">
                  Buat form peminjaman pertama
                </Button>
              }
              description="Belum ada data peminjaman."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title={`${editing ? "Edit" : "Form"} Peminjaman`}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Pilih Barang</span>
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
              <span className="text-sm font-bold text-muted-foreground">Tipe Peminjam</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                defaultValue={editing?.borrowerType ?? "STUDENT"}
                name="borrowerType"
                required
              >
                <option value="STUDENT">Siswa</option>
                <option value="TEACHER">Guru</option>
                <option value="STAFF">Staff</option>
                <option value="EXTERNAL">Eksternal</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Nama Lengkap Peminjam</span>
              <Input defaultValue={editing?.borrowerName ?? ""} name="borrowerName" required />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tanggal Jatuh Tempo</span>
              <Input
                defaultValue={editing?.dueAt ? new Date(editing.dueAt).toISOString().split("T")[0] : ""}
                name="dueAt"
                type="date"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jumlah Barang</span>
              <Input defaultValue={editing?.quantity ?? "1"} name="quantity" type="number" min="1" required />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Keperluan Peminjaman</span>
            <Input defaultValue={editing?.purpose ?? ""} name="purpose" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Catatan Tambahan</span>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={editing?.note ?? ""}
              name="note"
              rows={2}
            />
          </label>

          <div className="flex gap-3 justify-end mt-4">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
