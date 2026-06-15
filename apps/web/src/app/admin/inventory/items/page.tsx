"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, Edit3, Loader2, Plus, Printer, RefreshCcw, Search, Trash2 } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormModal,
  Input,
  PageHeader,
  StatusBadge,
  SectionCard,
} from "@nexsmsid/ui";
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

export default function InventoryItemsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItemRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const response = await api.getInventoryItems({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryItemRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<InventoryItemRow[]>(loadItems, [api, appliedSearch]);
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

  function openEdit(item: InventoryItemRow) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleDelete(item: InventoryItemRow) {
    const confirmed = window.confirm("Hapus barang ini? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.deleteInventoryItem(item.id);
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

  return (
    <div className="space-y-8">
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

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Daftar Barang</CardTitle>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama atau kode barang..."
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
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Nama</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Lokasi</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Kondisi</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.code}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.name}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.category?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.location?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge map={ITEM_STATUS_MAP} value={item.status} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge map={ITEM_CONDITION_MAP} value={item.condition} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => openEdit(item)} size="sm" variant="outline" aria-label="Edit">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={printingId === item.id}
                            onClick={() => handlePrint(item)}
                            size="sm"
                            variant="soft"
                            aria-label="Cetak PDF"
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
                  Tambah barang pertama
                </Button>
              }
              description="Belum ada data barang."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title={editing ? "Edit Barang" : "Tambah Barang"}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kode Barang</span>
            <Input defaultValue={editing?.code ?? ""} name="code" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Nama Barang</span>
            <Input defaultValue={editing?.name ?? ""} name="name" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kategori</span>
            <EntityPicker
              defaultValue={editing?.categoryId ?? ""}
              entityType="inventory-category"
              name="categoryId"
              placeholder="Cari kategori..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Lokasi</span>
            <EntityPicker
              defaultValue={editing?.locationId ?? ""}
              entityType="inventory-location"
              name="locationId"
              placeholder="Cari lokasi..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Jenis Barang</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={editing?.type ?? "ASSET"}
              name="type"
              required
            >
              <option value="ASSET">Aset Tetap (Asset)</option>
              <option value="CONSUMABLE">Barang Habis Pakai (Consumable)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kuantitas</span>
              <Input defaultValue={editing?.quantity ?? "1"} name="quantity" type="number" min="0" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Satuan</span>
              <Input defaultValue={editing?.unit ?? "pcs"} name="unit" placeholder="pcs/unit" />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Status</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={editing?.status ?? "ACTIVE"}
              name="status"
            >
              <option value="ACTIVE">Aktif / Tersedia</option>
              <option value="MAINTENANCE">Dalam Perbaikan</option>
              <option value="BORROWED">Sedang Dipinjam</option>
              <option value="DISPOSED">Afkir / Dibuang</option>
              <option value="LOST">Hilang</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kondisi</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={editing?.condition ?? "GOOD"}
              name="condition"
            >
              <option value="GOOD">Baik</option>
              <option value="FAIR">Cukup</option>
              <option value="DAMAGED">Rusak</option>
              <option value="HEAVILY_DAMAGED">Rusak Berat</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Stok Minimum (opsional)</span>
            <Input defaultValue={editing?.minStock ?? ""} name="minStock" type="number" min="0" />
          </label>

          <div className="flex gap-3 md:col-span-2 justify-end mt-4">
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
