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

type LibraryShelfRow = {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const emptyFormData = () => ({ id: "", code: "", name: "", location: "", description: "", isActive: true });

export default function LibraryShelvesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LibraryShelfRow | null>(null);
  const [formData, setFormData] = useState(emptyFormData);

  const loadShelves = useCallback(async () => {
    const res = await api.listLibraryShelves({ page: 1, limit: 50, search: appliedSearch || undefined });
    return res.data;
  }, [api, appliedSearch]);
  const { data: shelvesData, error: fetchError, loading, refetch } = useApiQuery<LibraryShelfRow[]>(loadShelves, [appliedSearch]);
  const shelves = shelvesData ?? [];
  const total = shelves.length;
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
      setActionError("Mohon isi kode dan nama rak");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        location: formData.location,
        description: formData.description,
        isActive: formData.isActive,
      };
      if (formData.id) {
        await api.updateLibraryShelf(formData.id, payload);
      } else {
        await api.createLibraryShelf(payload);
      }
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan rak");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteLibraryShelf(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus rak");
    }
  }

  function openCreate() {
    setFormData(emptyFormData());
    setFormOpen(true);
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
    setFormOpen(true);
  }

  const columns: DataTableColumn<LibraryShelfRow>[] = [
    {
      cell: (item) => item.code,
      header: "Kode",
      key: "code",
    },
    {
      cell: (item) => <span className="font-semibold">{item.name}</span>,
      header: "Nama Rak",
      key: "name",
    },
    {
      cell: (item) => item.location || "-",
      header: "Lokasi",
      key: "location",
    },
    {
      cell: (item) => item.description || "-",
      header: "Deskripsi",
      key: "description",
    },
    {
      cell: (item) => (
        <Badge variant={item.isActive === false ? "secondary" : "success"}>{item.isActive === false ? "Nonaktif" : "Aktif"}</Badge>
      ),
      header: "Status",
      key: "isActive",
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
              <Plus className="h-4 w-4" /> Tambah Rak
            </Button>
          </>
        }
        breadcrumb={["Admin", "Perpustakaan", "Rak"]}
        description="Kelola rak klasifikasi buku perpustakaan."
        eyebrow="Perpustakaan"
        title="Rak Buku"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses rak" /> : null}

      <SectionCard
        action={<SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari rak..." searchValue={search} />}
        description={
          <>
            Daftar rak buku perpustakaan. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Rak"
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
          data={shelves}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah rak pertama
              </Button>
            ),
            description: "Belum ada data rak atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[760px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi informasi rak penyimpanan buku."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={formData.id ? "Edit Rak" : "Tambah Rak"}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Kode Rak <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="RK-01"
              required
              value={formData.code}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Nama Rak <span className="text-destructive">*</span>
            </span>
            <Input
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Fiksi, Sains, dll."
              required
              value={formData.name}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Lokasi</span>
            <Input
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Lantai 1, Sudut Kanan..."
              value={formData.location}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Deskripsi</span>
            <Input
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Penjelasan rak..."
              value={formData.description}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={formData.isActive}
              className="h-4 w-4 rounded border-border"
              id="isActive"
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              type="checkbox"
            />
            <span className="text-sm font-semibold text-foreground">Aktif</span>
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
        description="Hapus rak ini? Tindakan tidak dapat dibatalkan."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus rak"
      />
    </div>
  );
}
