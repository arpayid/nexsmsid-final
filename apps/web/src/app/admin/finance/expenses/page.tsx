"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import type { ExpenseRecord } from "@nexsmsid/api-client";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormModal,
  Input,
  PageHeader,
  SearchFilterBar,
  SectionCard,
} from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const EXPENSE_STATUS_MAP: Record<string, { label: string; variant: "outline" | "info" | "success" | "secondary" }> = {
  DRAFT: { label: "Draf", variant: "outline" },
  APPROVED: { label: "Disetujui", variant: "info" },
  PAID: { label: "Dibayar", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

type ExpenseConfirmAction = "approve" | "delete" | "markPaid";

export default function ExpensesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: ExpenseConfirmAction; item: ExpenseRecord } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(() => api.listExpenses({ limit: 50, page: 1, search: appliedSearch || undefined }), [api, appliedSearch]);
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const items = data?.items ?? [];
  const total = data?.meta?.total ?? items.length;
  const error = actionError ?? fetchError;

  const statusInfo = useCallback((status: string) => EXPENSE_STATUS_MAP[status] ?? { label: status, variant: "outline" as const }, []);

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

  function openEdit(item: ExpenseRecord) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    try {
      if (action === "approve") await api.approveExpense(item.id);
      else if (action === "markPaid") await api.markExpensePaid(item.id);
      else await api.deleteExpense(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memproses pengeluaran");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      title: formData.get("title"),
      category: formData.get("category"),
      amount: Number(formData.get("amount")),
      description: (formData.get("description") as string) || undefined,
      expenseDate: (formData.get("expenseDate") as string) || undefined,
    };
    try {
      if (editing) {
        await api.updateExpense(editing.id, payload);
      } else {
        await api.createExpense(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan pengeluaran");
    } finally {
      setSubmitting(false);
    }
  }

  const confirmCopy: Record<ExpenseConfirmAction, { description: string; title: string }> = {
    approve: { description: "Setujui pengeluaran ini?", title: "Konfirmasi persetujuan" },
    delete: { description: "Hapus pengeluaran ini? Tindakan tidak dapat dibatalkan.", title: "Konfirmasi hapus" },
    markPaid: { description: "Tandai pengeluaran ini sebagai dibayar?", title: "Konfirmasi pembayaran" },
  };

  const columns: DataTableColumn<ExpenseRecord>[] = [
    {
      cell: (item) => item.expenseNumber ?? "-",
      header: "No. Pengeluaran",
      key: "expenseNumber",
    },
    {
      cell: (item) => item.title ?? "-",
      header: "Judul",
      key: "title",
    },
    {
      cell: (item) => item.category ?? "-",
      header: "Kategori",
      key: "category",
    },
    {
      cell: (item) => `Rp ${Number(item.amount ?? 0).toLocaleString("id-ID")}`,
      header: "Jumlah",
      key: "amount",
    },
    {
      cell: (item) => {
        const expenseDate = (item as ExpenseRecord & { expenseDate?: string }).expenseDate ?? item.date;
        return expenseDate ? new Date(expenseDate).toLocaleDateString("id-ID") : "-";
      },
      header: "Tanggal",
      key: "date",
    },
    {
      cell: (item) => {
        const status = item.status ?? "DRAFT";
        const st = statusInfo(status);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
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
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Keuangan", "Pengeluaran"]}
        description="Kelola pencatatan pengeluaran sekolah."
        eyebrow="Keuangan"
        title="Pengeluaran"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses pengeluaran" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari pengeluaran..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar pengeluaran operasional. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Pengeluaran"
      >
        <DataTable
          actions={(item) => {
            const status = item.status ?? "DRAFT";
            return (
              <>
                {status === "DRAFT" ? (
                  <>
                    <Button onClick={() => setPendingConfirm({ action: "approve", item })} size="sm" variant="soft">
                      <CheckCircle className="h-4 w-4" /> Setujui
                    </Button>
                    <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={() => setPendingConfirm({ action: "delete", item })} size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </>
                ) : null}
                {status === "APPROVED" ? (
                  <Button onClick={() => setPendingConfirm({ action: "markPaid", item })} size="sm" variant="soft">
                    <CheckCircle className="h-4 w-4" /> Tandai Dibayar
                  </Button>
                ) : null}
              </>
            );
          }}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah pengeluaran pertama
              </Button>
            ),
            description: "Belum ada data pengeluaran atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[800px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi detail pengeluaran sekolah."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={editing ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Judul</span>
            <Input defaultValue={editing?.title ?? ""} name="title" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kategori</span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={editing?.category ?? ""}
              name="category"
              required
            >
              <option value="" disabled>
                Pilih Kategori
              </option>
              <option value="UTILITIES">Utilitas</option>
              <option value="MAINTENANCE">Perawatan</option>
              <option value="SUPPLIES">Perlengkapan</option>
              <option value="SALARY">Gaji</option>
              <option value="TRANSPORT">Transportasi</option>
              <option value="EVENT">Kegiatan</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Jumlah</span>
            <Input defaultValue={editing?.amount != null ? String(editing.amount) : ""} min="0" name="amount" required type="number" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal</span>
            <Input
              defaultValue={(editing as ExpenseRecord & { expenseDate?: string })?.expenseDate ?? editing?.date ?? ""}
              name="expenseDate"
              type="date"
            />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Deskripsi</span>
              <textarea
                className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                defaultValue={editing?.note ?? ""}
                name="description"
                rows={3}
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
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
        description={pendingConfirm ? confirmCopy[pendingConfirm.action].description : ""}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmAction()}
        open={Boolean(pendingConfirm)}
        title={pendingConfirm ? confirmCopy[pendingConfirm.action].title : "Konfirmasi"}
      />
    </div>
  );
}
