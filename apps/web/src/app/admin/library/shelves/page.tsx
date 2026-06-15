"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";

import { Button, Card, CardContent, Input, PageHeader, FormModal } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryShelfRow = {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export default function LibraryShelvesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ id: "", code: "", name: "", location: "", description: "", isActive: true });

  const loadShelves = useCallback(async () => {
    const res = await api.listLibraryShelves({ page, limit: 50, search });
    return res.data;
  }, [api, page, search]);
  const { data: shelvesData, error, loading, refetch } = useApiQuery<LibraryShelfRow[]>(loadShelves, [page, search]);
  const shelves = shelvesData ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    setSaving(true);
    try {
      if (formData.id) {
        await api.updateLibraryShelf(formData.id, {
          code: formData.code,
          name: formData.name,
          location: formData.location,
          description: formData.description,
          isActive: formData.isActive,
        });
        alert("Rak berhasil diperbarui.");
      } else {
        await api.createLibraryShelf({
          code: formData.code,
          name: formData.name,
          location: formData.location,
          description: formData.description,
          isActive: formData.isActive,
        });
        alert("Rak berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan rak");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus rak ini?")) return;
    try {
      await api.deleteLibraryShelf(id);
      alert("Rak berhasil dihapus.");
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus rak");
    }
  }

  function openCreate() {
    setFormData({ id: "", code: "", name: "", location: "", description: "", isActive: true });
    setIsModalOpen(true);
  }

  function openEdit(item: LibraryShelfRow) {
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      location: item.location || "",
      description: item.description || "",
      isActive: item.isActive ?? true,
    });
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "Perpustakaan", "Rak"]} description="Kelola rak klasifikasi buku perpustakaan." title="Rak Buku" />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari rak..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Tambah Rak
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
                      <th className="px-4 py-3 font-medium">Kode</th>
                      <th className="px-4 py-3 font-medium">Nama Rak</th>
                      <th className="px-4 py-3 font-medium">Deskripsi</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shelves.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Tidak ada data rak.
                        </td>
                      </tr>
                    ) : (
                      shelves.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-muted">
                          <td className="px-4 py-3 font-medium">{item.code}</td>
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.description || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Rak" : "Tambah Rak"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Kode Rak <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="RK-01"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nama Rak <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Fiksi, Sains, dll."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lokasi</label>
            <Input
              placeholder="Lantai 1, Sudut Kanan..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              placeholder="Penjelasan rak..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Aktif
            </label>
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
    </div>
  );
}
