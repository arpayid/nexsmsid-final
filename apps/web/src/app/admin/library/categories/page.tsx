"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { Button, ConfirmDialog, DataTable, ErrorState, FormModal, Input, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryCategoryRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

const emptyFormData = () => ({ id: "", code: "", name: "", description: "" });

export default function LibraryCategoriesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LibraryCategoryRow | null>(null);
  const [formData, setFormData] = useState(emptyFormData);

  const loadCategories = useCallback(async () => {
    const res = await api.listLibraryCategories({ page: 1, limit: 50, search: appliedSearch || undefined });
    return res.data;
  }, [api, appliedSearch]);
  const { data: categoriesData, error: fetchError, loading, refetch } = useApiQuery<LibraryCategoryRow[]>(loadCategories, [appliedSearch]);
  const categories = categoriesData ?? [];
  const total = categories.length;
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
    if (!formData.code || !formData.name) {
      setActionError("Mohon isi kode dan nama kategori");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      if (formData.id) {
        await api.updateLibraryCategory(formData.id, { code: formData.code, name: formData.name, description: formData.description });
      } else {
        await api.createLibraryCategory({ code: formData.code, name: formData.name, description: formData.description });
      }
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan kategori");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteLibraryCategory(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus kategori");
    }
  }

  function openCreate() {
    setFormData(emptyFormData());
    setFormOpen(true);
  }

  function openEdit(item: LibraryCategoryRow) {
    setFormData({ id: item.id, code: item.code, name: item.name, description: item.description || "" });
    setFormOpen(true);
  }

  const columns: DataTableColumn<LibraryCategoryRow>[] = [
    {
      cell: (item) => item.code,
      header: "Kode",
      key: "code",
    },
    {
      cell: (item) => <span className="font-semibold">{item.name}</span>,
      header: "Nama Kategori",
      key: "name",
    },
    {
      cell: (item) => item.description || "-",
      header: "Deskripsi",
      key: "description",
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
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          </>
        }
        breadcrumb={["Admin", "Perpustakaan", "Kategori"]}
        description="Kelola kategori klasifikasi buku perpustakaan."
        eyebrow="Perpustakaan"
        title="Kategori Buku"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses kategori" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari kategori..." searchValue={search} />
        }
        description={
          <>
            Daftar kategori buku. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Kategori"
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
          data={categories}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah kategori pertama
              </Button>
            ),
            description: "Belum ada data kategori atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[640px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi kode dan nama kategori buku."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={formData.id ? "Edit Kategori" : "Tambah Kategori"}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Kode Kategori <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="CT-01"
              required
              value={formData.code}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Nama Kategori <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Fiksi, Sains, dll."
              required
              value={formData.name}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Deskripsi</span>
            <Input
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Penjelasan kategori..."
              value={formData.description}
            />
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
        description="Hapus kategori ini? Tindakan tidak dapat dibatalkan."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus kategori"
      />
    </div>
  );
}
