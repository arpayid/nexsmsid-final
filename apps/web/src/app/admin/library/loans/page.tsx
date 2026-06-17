"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, Loader2, Plus, RefreshCcw, XCircle } from "lucide-react";

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

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryLoanRow = {
  id: string;
  status: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  copy?: { copyCode?: string; book?: { title?: string } };
  member?: {
    memberCode?: string;
    externalName?: string;
    student?: { name?: string };
    teacher?: { name?: string };
  };
};

const LOAN_STATUS_MAP: Record<string, { label: string; variant: "outline" | "info" | "success" | "secondary" | "warning" }> = {
  BORROWED: { label: "Dipinjam", variant: "info" },
  RETURNED: { label: "Dikembalikan", variant: "success" },
  OVERDUE: { label: "Terlambat", variant: "warning" },
  LOST: { label: "Hilang", variant: "secondary" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

const emptyLoanForm = () => ({
  memberId: "",
  copyId: "",
  dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  note: "",
});

export default function LibraryLoansPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [returnFormOpen, setReturnFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<LibraryLoanRow | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LibraryLoanRow | null>(null);
  const [formData, setFormData] = useState(emptyLoanForm);
  const [returnFormData, setReturnFormData] = useState({ returnNote: "", condition: "GOOD" });

  const loadLoans = useCallback(async () => {
    const res = await api.listLibraryLoans({ page: 1, limit: 50, search: appliedSearch || undefined });
    return res.data;
  }, [api, appliedSearch]);
  const { data: loansData, error: fetchError, loading, refetch } = useApiQuery<LibraryLoanRow[]>(loadLoans, [appliedSearch]);
  const loans = loansData ?? [];
  const total = loans.length;
  const error = actionError ?? fetchError;

  const statusInfo = useCallback((status: string) => LOAN_STATUS_MAP[status] ?? { label: status, variant: "outline" as const }, []);

  function memberName(item: LibraryLoanRow) {
    return item.member?.student?.name || item.member?.teacher?.name || item.member?.externalName || item.member?.memberCode || "-";
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      await api.createLibraryLoan({
        memberId: formData.memberId,
        copyId: formData.copyId,
        dueAt: new Date(formData.dueAt).toISOString(),
        note: formData.note,
      });
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan peminjaman");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturnSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.returnLibraryLoan(selectedLoan.id, {
        returnNote: returnFormData.returnNote,
        condition: returnFormData.condition,
      });
      setReturnFormOpen(false);
      setSelectedLoan(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mengembalikan buku");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    setActionError(null);
    try {
      await api.cancelLibraryLoan(pendingCancel.id);
      setPendingCancel(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan peminjaman");
    }
  }

  function openCreate() {
    setFormData(emptyLoanForm());
    setFormOpen(true);
  }

  function openReturn(loan: LibraryLoanRow) {
    setSelectedLoan(loan);
    setReturnFormData({ returnNote: "", condition: "GOOD" });
    setReturnFormOpen(true);
  }

  const columns: DataTableColumn<LibraryLoanRow>[] = [
    {
      cell: (item) => (
        <div>
          <div className="font-semibold">{item.copy?.book?.title ?? "-"}</div>
          <div className="text-xs text-muted-foreground">Kode Copy: {item.copy?.copyCode ?? "-"}</div>
        </div>
      ),
      header: "Buku & Eksemplar",
      key: "book",
    },
    {
      cell: (item) => memberName(item),
      header: "Peminjam",
      key: "member",
    },
    {
      cell: (item) => new Date(item.borrowedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      header: "Tgl Pinjam",
      key: "borrowedAt",
    },
    {
      cell: (item) => (
        <div>
          <div className={new Date(item.dueAt) < new Date() && item.status === "BORROWED" ? "font-semibold text-destructive" : ""}>
            {new Date(item.dueAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          {item.returnedAt ? (
            <div className="mt-1 text-xs text-emerald-600">
              Dikembalikan: {new Date(item.returnedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          ) : null}
        </div>
      ),
      header: "Tgl Kembali",
      key: "dueAt",
    },
    {
      cell: (item) => {
        const st = statusInfo(item.status);
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
              <Plus className="h-4 w-4" /> Peminjaman Baru
            </Button>
          </>
        }
        breadcrumb={["Admin", "Perpustakaan", "Peminjaman"]}
        description="Kelola transaksi peminjaman dan pengembalian buku."
        eyebrow="Perpustakaan"
        title="Sirkulasi Peminjaman"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses peminjaman" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari transaksi..." searchValue={search} />
        }
        description={
          <>
            Daftar transaksi peminjaman buku. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Peminjaman"
      >
        <DataTable
          actions={(item) =>
            item.status === "BORROWED" || item.status === "OVERDUE" ? (
              <>
                <Button onClick={() => openReturn(item)} size="sm" variant="soft">
                  <CheckCircle className="h-4 w-4" /> Kembali
                </Button>
                <Button onClick={() => setPendingCancel(item)} size="sm" variant="ghost">
                  <XCircle className="h-4 w-4" /> Batalkan
                </Button>
              </>
            ) : null
          }
          columns={columns}
          data={loans}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Catat peminjaman pertama
              </Button>
            ),
            description: "Belum ada data transaksi atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal description="Catat peminjaman buku baru." onClose={() => setFormOpen(false)} open={formOpen} title="Peminjaman Baru">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Anggota <span className="text-destructive">*</span>
            </span>
            <EntityPicker
              entityType="library-member"
              onChange={(memberId) => setFormData({ ...formData, memberId })}
              placeholder="Cari anggota perpustakaan..."
              value={formData.memberId}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Eksemplar Buku <span className="text-destructive">*</span>
            </span>
            <EntityPicker
              entityType="library-copy"
              onChange={(copyId) => setFormData({ ...formData, copyId })}
              placeholder="Cari eksemplar buku..."
              value={formData.copyId}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Tenggat Waktu (Due Date) <span className="text-destructive">*</span>
            </span>
            <Input onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })} required type="date" value={formData.dueAt} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Catatan</span>
            <Input onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Opsional..." value={formData.note} />
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

      <FormModal
        description="Proses pengembalian buku yang dipinjam."
        onClose={() => setReturnFormOpen(false)}
        open={returnFormOpen}
        title="Pengembalian Buku"
      >
        <form className="grid gap-4" onSubmit={handleReturnSubmit}>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm font-semibold">{selectedLoan?.copy?.book?.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">Peminjam: {selectedLoan ? memberName(selectedLoan) : "-"}</div>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Kondisi Buku <span className="text-destructive">*</span>
            </span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onChange={(e) => setReturnFormData({ ...returnFormData, condition: e.target.value })}
              required
              value={returnFormData.condition}
            >
              <option value="GOOD">Baik (Good)</option>
              <option value="DAMAGED">Rusak Sedang (Damaged)</option>
              <option value="HEAVILY_DAMAGED">Rusak Berat (Heavily Damaged)</option>
              <option value="LOST">Hilang (Lost)</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Catatan Pengembalian</span>
            <Input
              onChange={(e) => setReturnFormData({ ...returnFormData, returnNote: e.target.value })}
              placeholder="Kondisi cover sedikit tertekuk..."
              value={returnFormData.returnNote}
            />
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setReturnFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Proses Pengembalian
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        description="Batalkan peminjaman ini? Eksemplar akan kembali tersedia."
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => void confirmCancel()}
        open={Boolean(pendingCancel)}
        title="Konfirmasi batalkan peminjaman"
      />
    </div>
  );
}
