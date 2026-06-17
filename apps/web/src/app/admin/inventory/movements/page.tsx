"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Plus, RefreshCcw, Loader2 } from "lucide-react";

import { Button, DataTable, ErrorState, FormModal, Input, PageHeader, SearchFilterBar, SectionCard, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";

type InventoryMovementRow = {
  id: string;
  type: string;
  quantity: number;
  performedAt: string;
  item?: { name?: string };
  fromLocation?: { name?: string };
  toLocation?: { name?: string };
  performedBy?: { name?: string };
};

type MovementPayload = {
  itemId: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  quantity: number;
  fromLocationId?: FormDataEntryValue;
  toLocationId?: FormDataEntryValue;
  note?: FormDataEntryValue;
};

type StatusBadgeVariant = "success" | "warning" | "info" | "outline" | "secondary";

const MOVEMENT_TYPE_MAP: Record<string, { label: string; variant: StatusBadgeVariant }> = {
  IN: { label: "Barang Masuk", variant: "success" },
  OUT: { label: "Barang Keluar", variant: "warning" },
  TRANSFER: { label: "Pindah Lokasi", variant: "info" },
  DISPOSE: { label: "Afkir/Dibuang", variant: "outline" },
  MAINTENANCE: { label: "Pemeliharaan", variant: "secondary" },
  RETURN: { label: "Pengembalian", variant: "success" },
};

const SELECT_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function InventoryMovementsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadMovements = useCallback(async () => {
    const response = await api.getInventoryMovements({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryMovementRow[] }).data || [];
  }, [api, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<InventoryMovementRow[]>(loadMovements, [api, appliedSearch]);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);

    const payload: MovementPayload = {
      itemId: formData.get("itemId"),
      type: formData.get("type"),
      quantity: Number(formData.get("quantity") || 1),
      fromLocationId: formData.get("fromLocationId") || undefined,
      toLocationId: formData.get("toLocationId") || undefined,
      note: formData.get("note") || undefined,
    };

    try {
      await api.createInventoryMovement(payload);
      setFormOpen(false);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan mutasi barang");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<InventoryMovementRow>[] = [
    {
      cell: (item) => new Date(item.performedAt).toLocaleString("id-ID"),
      header: "Waktu",
      key: "performedAt",
    },
    { cell: (item) => item.item?.name ?? "-", header: "Barang", key: "item" },
    {
      cell: (item) => <StatusBadge map={MOVEMENT_TYPE_MAP} value={item.type} />,
      header: "Jenis",
      key: "type",
    },
    { cell: (item) => item.quantity, header: "Qty", key: "quantity" },
    { cell: (item) => item.fromLocation?.name ?? "-", header: "Lokasi Asal", key: "fromLocation" },
    { cell: (item) => item.toLocation?.name ?? "-", header: "Lokasi Tujuan", key: "toLocation" },
    { cell: (item) => item.performedBy?.name ?? "-", header: "Petugas", key: "performedBy" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Mutasi
            </Button>
          </>
        }
        breadcrumb={["Admin", "Inventaris", "Mutasi Barang"]}
        description="Pencatatan pergerakan barang, transfer lokasi, masuk dan keluar."
        eyebrow="Sarpras"
        title="Mutasi Barang"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses mutasi barang" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari mutasi..." searchValue={search} />
        }
        description={
          <>
            Riwayat mutasi barang. Total: <strong>{total}</strong> data.
          </>
        }
        title="Riwayat Mutasi"
      >
        <DataTable
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={() => setFormOpen(true)} variant="soft">
                Tambah mutasi pertama
              </Button>
            ),
            description: "Belum ada riwayat mutasi barang atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Catat pergerakan atau transfer barang inventaris."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title="Catat Mutasi / Transfer Barang"
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Pilih Barang</span>
            <EntityPicker entityType="inventory-item" name="itemId" placeholder="Cari barang..." required />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Jenis Mutasi</span>
              <select className={SELECT_CLASS} name="type" required>
                <option value="IN">Barang Masuk (IN)</option>
                <option value="OUT">Barang Keluar (OUT)</option>
                <option value="TRANSFER">Pindah Lokasi (TRANSFER)</option>
                <option value="DISPOSE">Afkir (DISPOSE)</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Kuantitas</span>
              <Input defaultValue="1" name="quantity" type="number" min="1" required />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Dari Lokasi</span>
              <EntityPicker entityType="inventory-location" name="fromLocationId" placeholder="Cari lokasi asal..." />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Ke Lokasi</span>
              <EntityPicker entityType="inventory-location" name="toLocationId" placeholder="Cari lokasi tujuan..." />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Catatan Mutasi</span>
            <textarea className={SELECT_CLASS} name="note" rows={2} />
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
    </div>
  );
}
