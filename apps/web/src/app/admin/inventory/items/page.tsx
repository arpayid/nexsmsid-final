"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Printer, RefreshCcw, Trash2 } from "lucide-react";

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

type InventoryItemRow = {
  id: string;
  code?: string;
  name?: string;
  categoryId?: string;
  locationId?: string;
  type?: string;
  quantity?: number;
  minStock?: number;
  unit?: string;
  status?: string;
  condition?: string;
  brand?: string;
  model?: string;
  supplier?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  category?: { name?: string };
  location?: { name?: string };
};

type StatusMapEntry = {
  label: string;
  variant: "success" | "warning" | "info" | "secondary" | "outline";
};

const ITEM_STATUS_MAP: Record<string, StatusMapEntry> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  MAINTENANCE: { label: "Perbaikan", variant: "warning" },
  BORROWED: { label: "Dipinjam", variant: "info" },
  DISPOSED: { label: "Dihapus/Afkir", variant: "secondary" },
  LOST: { label: "Hilang", variant: "outline" },
};

const ITEM_CONDITION_MAP: Record<string, StatusMapEntry> = {
  GOOD: { label: "Baik", variant: "success" },
  FAIR: { label: "Cukup", variant: "info" },
  DAMAGED: { label: "Rusak", variant: "warning" },
  HEAVILY_DAMAGED: { label: "Rusak Berat", variant: "outline" },
};

const SELECT_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function InventoryItemsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItemRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InventoryItemRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const response = await api.getInventoryItems({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryItemRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<InventoryItemRow[]>(loadItems, [api, appliedSearch]);
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

  function openEdit(item: InventoryItemRow) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteInventoryItem(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus barang");
    }
  }

  async function handlePrint(item: InventoryItemRow) {
    setActionError(null);
    setPrintingId(item.id);
    try {
      await api.downloadInventoryItemPdf(item.id);
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "Gagal membuat PDF barang");
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
      code: formData.get("code"),
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      locationId: formData.get("locationId") || undefined,
      type: formData.get("type"),
      quantity: Number(formData.get("quantity") || 0),
      minStock: formData.get("minStock") ? Number(formData.get("minStock")) : undefined,
      unit: formData.get("unit") || undefined,
      status: formData.get("status") || "ACTIVE",
      condition: formData.get("condition") || "GOOD",
      brand: formData.get("brand") || undefined,
      model: formData.get("model") || undefined,
      supplier: formData.get("supplier") || undefined,
      purchasePrice: formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : undefined,
      purchaseDate: formData.get("purchaseDate") || undefined,
    };

    try {
      if (editing) {
        await api.updateInventoryItem(editing.id, payload);
      } else {
        await api.createInventoryItem(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan barang");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<InventoryItemRow>[] = [
    { cell: (item) => item.code ?? "-", header: "Kode", key: "code" },
    { cell: (item) => item.name ?? "-", header: "Nama", key: "name" },
    { cell: (item) => item.category?.name ?? "-", header: "Kategori", key: "category" },
    { cell: (item) => item.location?.name ?? "-", header: "Lokasi", key: "location" },
    {
      cell: (item) => `${item.quantity ?? 0} ${item.unit ?? ""}`.trim(),
      header: "Qty",
      key: "quantity",
    },
    {
      cell: (item) => <StatusBadge map={ITEM_STATUS_MAP} value={item.status} />,
      header: "Status",
      key: "status",
    },
    {
      cell: (item) => <StatusBadge map={ITEM_CONDITION_MAP} value={item.condition} />,
      header: "Kondisi",
      key: "condition",
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
        breadcrumb={["Admin", "Inventaris", "Data Barang"]}
        description="Kelola data barang inventaris, aset tetap, dan barang habis pakai."
        eyebrow="Sarpras"
        title="Data Barang"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses data barang" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari nama atau kode barang..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar barang inventaris. Total: <strong>{total}</strong> data.
          </>
        }
        title="Daftar Barang"
      >
        <DataTable
          actions={(item) => (
            <>
              <Button onClick={() => openEdit(item)} size="sm" variant="outline" aria-label="Edit">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button
                disabled={printingId === item.id}
                onClick={() => void handlePrint(item)}
                size="sm"
                variant="soft"
                aria-label="Cetak PDF"
              >
                {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} PDF
              </Button>
              <Button onClick={() => setPendingDelete(item)} size="sm" variant="ghost" aria-label="Hapus">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah barang pertama
              </Button>
            ),
            description: "Belum ada data barang atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi detail barang inventaris."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={editing ? "Edit Barang" : "Tambah Barang"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kode Barang</span>
            <Input defaultValue={editing?.code ?? ""} name="code" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Nama Barang</span>
            <Input defaultValue={editing?.name ?? ""} name="name" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kategori</span>
            <EntityPicker
              defaultValue={editing?.categoryId ?? ""}
              entityType="inventory-category"
              name="categoryId"
              placeholder="Cari kategori..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Lokasi</span>
            <EntityPicker
              defaultValue={editing?.locationId ?? ""}
              entityType="inventory-location"
              name="locationId"
              placeholder="Cari lokasi..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Jenis Barang</span>
            <select className={SELECT_CLASS} defaultValue={editing?.type ?? "ASSET"} name="type" required>
              <option value="ASSET">Aset Tetap (Asset)</option>
              <option value="CONSUMABLE">Barang Habis Pakai (Consumable)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Kuantitas</span>
              <Input defaultValue={editing?.quantity ?? "1"} name="quantity" type="number" min="0" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Satuan</span>
              <Input defaultValue={editing?.unit ?? "pcs"} name="unit" placeholder="pcs/unit" />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Status</span>
            <select className={SELECT_CLASS} defaultValue={editing?.status ?? "ACTIVE"} name="status">
              <option value="ACTIVE">Aktif / Tersedia</option>
              <option value="MAINTENANCE">Dalam Perbaikan</option>
              <option value="BORROWED">Sedang Dipinjam</option>
              <option value="DISPOSED">Afkir / Dibuang</option>
              <option value="LOST">Hilang</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kondisi</span>
            <select className={SELECT_CLASS} defaultValue={editing?.condition ?? "GOOD"} name="condition">
              <option value="GOOD">Baik</option>
              <option value="FAIR">Cukup</option>
              <option value="DAMAGED">Rusak</option>
              <option value="HEAVILY_DAMAGED">Rusak Berat</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Stok Minimum (opsional)</span>
            <Input defaultValue={editing?.minStock ?? ""} name="minStock" type="number" min="0" />
          </label>

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
        description="Hapus barang ini? Tindakan ini tidak dapat dibatalkan."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus"
      />
    </div>
  );
}
