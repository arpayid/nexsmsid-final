"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, AlertCircle, BookOpen } from "lucide-react";

import { Button, Card, CardContent, Input, PageHeader, FormModal } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryCategoryRow = {
  id: string;
  name: string;
};

type LibraryBookRow = {
  id: string;
  categoryId: string;
  code: string;
  title: string;
  author: string;
  publisher?: string | null;
  publicationYear?: number | null;
  isbn?: string | null;
  description?: string | null;
  category?: { name?: string };
  _count?: { copies?: number };
};

type BooksData = {
  books: LibraryBookRow[];
  categories: LibraryCategoryRow[];
};

export default function LibraryBooksPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    categoryId: "",
    code: "",
    title: "",
    author: "",
    publisher: "",
    publicationYear: new Date().getFullYear(),
    isbn: "",
    description: "",
  });

  const loadBooks = useCallback(async () => {
    const [resBooks, resCategories] = await Promise.all([
      api.listLibraryBooks({ page, limit: 50, search }),
      api.listLibraryCategories({ limit: 100 }),
    ]);
    return { books: resBooks.data, categories: resCategories.data };
  }, [api, page, search]);
  const { data, error, loading, refetch } = useApiQuery<BooksData>(loadBooks, [page, search]);
  const books = data?.books ?? [];
  const categories = data?.categories ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.categoryId || !formData.code || !formData.author) {
      return alert("Mohon isi kolom yang wajib (Kategori, Kode, Judul, Penulis)");
    }

    setSaving(true);
    try {
      const payload = {
        categoryId: formData.categoryId,
        code: formData.code,
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher,
        publicationYear: Number(formData.publicationYear),
        isbn: formData.isbn,
        description: formData.description,
      };

      if (formData.id) {
        await api.updateLibraryBook(formData.id, payload);
        alert("Data buku berhasil diperbarui.");
      } else {
        await api.createLibraryBook(payload);
        alert("Buku baru berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan buku");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini? Semua eksemplar akan ikut terhapus.")) return;
    try {
      await api.deleteLibraryBook(id);
      alert("Buku berhasil dihapus.");
      void refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus buku");
    }
  }

  function openCreate() {
    setFormData({
      id: "",
      categoryId: "",
      code: "",
      title: "",
      author: "",
      publisher: "",
      publicationYear: new Date().getFullYear(),
      isbn: "",
      description: "",
    });
    setIsModalOpen(true);
  }

  function openEdit(item: LibraryBookRow) {
    setFormData({
      id: item.id,
      categoryId: item.categoryId,
      code: item.code,
      title: item.title,
      author: item.author,
      publisher: item.publisher || "",
      publicationYear: item.publicationYear || new Date().getFullYear(),
      isbn: item.isbn || "",
      description: item.description || "",
    });
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Admin", "Perpustakaan", "Data Buku"]}
        description="Kelola katalog buku, judul, pengarang, dan klasifikasi buku perpustakaan."
        title="Data Buku"
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari buku..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Tambah Buku
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
                      <th className="px-4 py-3 font-medium">Kode/ISBN</th>
                      <th className="px-4 py-3 font-medium">Judul Buku</th>
                      <th className="px-4 py-3 font-medium">Pengarang</th>
                      <th className="px-4 py-3 font-medium">Penerbit</th>
                      <th className="px-4 py-3 font-medium">Kategori</th>
                      <th className="px-4 py-3 font-medium">Eksemplar</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {books.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Tidak ada data buku ditemukan.
                        </td>
                      </tr>
                    ) : (
                      books.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-muted transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {item.code}
                            {item.isbn && <div className="text-xs text-muted-foreground font-normal">ISBN: {item.isbn}</div>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary">{item.title}</td>
                          <td className="px-4 py-3">{item.author}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.publisher || "-"} ({item.publicationYear})
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                              {item.category?.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{item._count?.copies || 0}</td>
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

      <FormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Buku" : "Tambah Buku"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Kode Buku <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="BK-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Judul Buku <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Masukkan judul buku"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pengarang <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Nama Pengarang"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Penerbit</label>
              <Input
                placeholder="Penerbit"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun Terbit</label>
              <Input
                type="number"
                value={formData.publicationYear}
                onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ISBN</label>
              <Input placeholder="123-456-789" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {formData.id ? "Simpan Perubahan" : "Tambahkan Buku"}
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
