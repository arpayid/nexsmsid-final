"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Search, CheckCircle, XCircle, AlertTriangle, Loader2, AlertCircle } from "lucide-react";

import { Button, Card, CardContent, Input, PageHeader, FormModal } from "@nexsmsid/ui";
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

export default function LibraryLoansPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<LibraryLoanRow | null>(null);

  const [formData, setFormData] = useState(() => ({
    memberId: "",
    copyId: "",
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
    note: "",
  }));

  const [returnFormData, setReturnFormData] = useState({
    returnNote: "",
    condition: "GOOD",
  });

  // Since we don't have a lookup dropdown ready here,
  // ideally we'd search members and copies dynamically.
  // For simplicity, we just use text inputs for IDs if it's purely a UI demo,
  // but a real app uses react-select. We'll use text input here.

  const loadLoans = useCallback(async () => {
    const res = await api.listLibraryLoans({ page, limit: 50, search });
    return res.data;
  }, [api, page, search]);
  const { data: loansData, error, loading, refetch } = useApiQuery<LibraryLoanRow[]>(loadLoans, [page, search]);
  const loans = loansData ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLibraryLoan({
        memberId: formData.memberId,
        copyId: formData.copyId,
        dueAt: new Date(formData.dueAt).toISOString(),
        note: formData.note,
      });
      alert("Peminjaman berhasil dicatat.");
      setIsModalOpen(false);
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLoan) return;
    setSaving(true);
    try {
      await api.returnLibraryLoan(selectedLoan.id, {
        returnNote: returnFormData.returnNote,
        condition: returnFormData.condition,
      });
      alert("Buku berhasil dikembalikan.");
      setIsReturnModalOpen(false);
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengembalikan buku");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Batalkan peminjaman ini?")) return;
    try {
      await api.cancelLibraryLoan(id);
      alert("Peminjaman dibatalkan.");
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membatalkan");
    }
  }

  function openCreate() {
    setFormData({
      memberId: "",
      copyId: "",
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      note: "",
    });
    setIsModalOpen(true);
  }

  function openReturn(loan: LibraryLoanRow) {
    setSelectedLoan(loan);
    setReturnFormData({ returnNote: "", condition: "GOOD" });
    setIsReturnModalOpen(true);
  }

  function renderStatus(status: string) {
    switch (status) {
      case "BORROWED":
        return <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Dipinjam</span>;
      case "RETURNED":
        return (
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Dikembalikan</span>
        );
      case "OVERDUE":
        return <span className="inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">Terlambat</span>;
      case "LOST":
        return <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">Hilang</span>;
      case "CANCELLED":
        return <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">Dibatalkan</span>;
      default:
        return <span>{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Admin", "Perpustakaan", "Peminjaman"]}
        description="Kelola transaksi peminjaman dan pengembalian buku."
        title="Sirkulasi Peminjaman"
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Peminjaman Baru
            </Button>
          </div>

          {error ? (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          ) : loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Buku & Eksemplar</th>
                      <th className="px-4 py-3 font-medium">Peminjam</th>
                      <th className="px-4 py-3 font-medium">Tgl Pinjam</th>
                      <th className="px-4 py-3 font-medium">Tgl Kembali</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Tidak ada data transaksi.
                        </td>
                      </tr>
                    ) : (
                      loans.map((item) => {
                        const memberName =
                          item.member?.student?.name || item.member?.teacher?.name || item.member?.externalName || item.member?.memberCode;
                        return (
                          <tr key={item.id} className="hover:bg-surface-muted">
                            <td className="px-4 py-3">
                              <div className="font-semibold">{item.copy?.book?.title}</div>
                              <div className="text-xs text-muted-foreground">Kode Copy: {item.copy?.copyCode}</div>
                            </td>
                            <td className="px-4 py-3 font-medium">{memberName}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(item.borrowedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <div
                                className={
                                  new Date(item.dueAt) < new Date() && item.status === "BORROWED" ? "text-rose-600 font-semibold" : ""
                                }
                              >
                                {new Date(item.dueAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                              </div>
                              {item.returnedAt && (
                                <div className="text-xs text-emerald-600 mt-1">
                                  Dikembalikan:{" "}
                                  {new Date(item.returnedAt).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">{renderStatus(item.status)}</td>
                            <td className="px-4 py-3 text-right">
                              {(item.status === "BORROWED" || item.status === "OVERDUE") && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => openReturn(item)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" /> Kembali
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={() => handleCancel(item.id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <FormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Peminjaman Baru">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Anggota <span className="text-rose-500">*</span>
            </label>
            <EntityPicker
              entityType="library-member"
              onChange={(memberId) => setFormData({ ...formData, memberId })}
              placeholder="Cari anggota perpustakaan..."
              value={formData.memberId}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Eksemplar Buku <span className="text-rose-500">*</span>
            </label>
            <EntityPicker
              entityType="library-copy"
              onChange={(copyId) => setFormData({ ...formData, copyId })}
              placeholder="Cari eksemplar buku..."
              value={formData.copyId}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tenggat Waktu (Due Date) <span className="text-rose-500">*</span>
            </label>
            <Input type="date" value={formData.dueAt} onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan</label>
            <Input placeholder="Opsional..." value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </div>
        </form>
      </FormModal>

      {/* RETURN MODAL */}
      <FormModal open={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Pengembalian Buku">
        <form onSubmit={handleReturnSubmit} className="space-y-4 pt-4">
          <div className="rounded-lg bg-surface-muted p-4 mb-4">
            <div className="text-sm font-semibold">{selectedLoan?.copy?.book?.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Peminjam: {selectedLoan?.member?.student?.name || selectedLoan?.member?.memberCode}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Kondisi Buku <span className="text-rose-500">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={returnFormData.condition}
              onChange={(e) => setReturnFormData({ ...returnFormData, condition: e.target.value })}
              required
            >
              <option value="GOOD">Baik (Good)</option>
              <option value="DAMAGED">Rusak Sedang (Damaged)</option>
              <option value="HEAVILY_DAMAGED">Rusak Berat (Heavily Damaged)</option>
              <option value="LOST">Hilang (Lost)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan Pengembalian</label>
            <Input
              placeholder="Kondisi cover sedikit tertekuk..."
              value={returnFormData.returnNote}
              onChange={(e) => setReturnFormData({ ...returnFormData, returnNote: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Proses Pengembalian
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
