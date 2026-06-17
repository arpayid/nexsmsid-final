"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

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

const emptyFormData = () => ({
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

export default function LibraryBooksPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LibraryBookRow | null>(null);
  const [formData, setFormData] = useState(emptyFormData);

  const loadBooks = useCallback(async () => {
    const [resBooks, resCategories] = await Promise.all([
      api.listLibraryBooks({ page: 1, limit: 50, search: appliedSearch || undefined }),
      api.listLibraryCategories({ limit: 100 }),
    ]);
    return { books: resBooks.data, categories: resCategories.data };
  }, [api, appliedSearch]);
  const { data, error: fetchError, loading, refetch } = useApiQuery<BooksData>(loadBooks, [appliedSearch]);
  const books = data?.books ?? [];
  const categories = data?.categories ?? [];
  const total = books.length;
  const error = actionError ?? fetchError;

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
    if (!formData.title || !formData.categoryId || !formData.code || !formData.author) {
      setActionError("Mohon isi kolom yang wajib (Kategori, Kode, Judul, Penulis)");
      return;
    }

    setSubmitting(true);
    setActionError(null);
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
      } else {
        await api.createLibraryBook(payload);
      }
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan buku");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteLibraryBook(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus buku");
    }
  }

  function openCreate() {
    setFormData(emptyFormData());
    setFormOpen(true);
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
    setFormOpen(true);
  }

  const columns: DataTableColumn<LibraryBookRow>[] = [
    {
      cell: (item) => (
        <div>
          <div className="font-medium">{item.code}</div>
          {item.isbn ? <div className="text-xs text-muted-foreground">ISBN: {item.isbn}</div> : null}
        </div>
      ),
      header: "Kode/ISBN",
      key: "code",
    },
    {
      cell: (item) => <span className="font-semibold text-primary">{item.title}</span>,
      header: "Judul Buku",
      key: "title",
    },
    {
      cell: (item) => item.author,
      header: "Pengarang",
      key: "author",
    },
    {
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.publisher || "-"} ({item.publicationYear ?? "-"})
        </span>
      ),
      header: "Penerbit",
      key: "publisher",
    },
    {
      cell: (item) => <Badge variant="secondary">{item.category?.name ?? "-"}</Badge>,
      header: "Kategori",
      key: "category",
    },
    {
      cell: (item) => item._count?.copies ?? 0,
      header: "Eksemplar",
      key: "copies",
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
              <Plus className="h-4 w-4" /> Tambah Buku
            </Button>
          </>
        }
        breadcrumb={["Admin", "Perpustakaan", "Data Buku"]}
        description="Kelola katalog buku, judul, pengarang, dan klasifikasi buku perpustakaan."
        eyebrow="Perpustakaan"
        title="Data Buku"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses data buku" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari buku..." searchValue={search} />
        }
        description={
          <>
            Daftar katalog buku perpustakaan. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Buku"
      >
        <DataTable
          actions={(item) => (
            <>
              <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => setPendingDelete(item)} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={books}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah buku pertama
              </Button>
            ),
            description: "Belum ada data buku atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi informasi katalog buku perpustakaan."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={formData.id ? "Edit Buku" : "Tambah Buku"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Kategori <span className="text-destructive">*</span>
            </span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              value={formData.categoryId}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Kode Buku <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="BK-001"
              required
              value={formData.code}
            />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Judul Buku <span className="text-destructive">*</span>
              </span>
              <Input
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul buku"
                required
                value={formData.title}
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Pengarang <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Nama Pengarang"
              required
              value={formData.author}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Penerbit</span>
            <Input
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="Penerbit"
              value={formData.publisher}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tahun Terbit</span>
            <Input
              onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value, 10) || new Date().getFullYear() })}
              type="number"
              value={formData.publicationYear}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">ISBN</span>
            <Input onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="123-456-789" value={formData.isbn} />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {formData.id ? "Simpan Perubahan" : "Tambahkan Buku"}
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        description="Hapus buku ini? Semua eksemplar akan ikut terhapus. Tindakan tidak dapat dibatalkan."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus buku"
      />
    </div>
  );
}
