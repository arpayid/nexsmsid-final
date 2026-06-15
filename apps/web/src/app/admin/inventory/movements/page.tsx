"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCcw, Search, Loader2 } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader, StatusBadge } from "@nexsmsid/ui";
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

  const MOVEMENT_TYPE_MAP: Record<string, { label: string; variant: StatusBadgeVariant }> = {
    IN: { label: "Barang Masuk", variant: "success" },
    OUT: { label: "Barang Keluar", variant: "warning" },
    TRANSFER: { label: "Pindah Lokasi", variant: "info" },
    DISPOSE: { label: "Afkir/Dibuang", variant: "outline" },
    MAINTENANCE: { label: "Pemeliharaan", variant: "secondary" },
    RETURN: { label: "Pengembalian", variant: "success" },
  };

  return (
    <div className="space-y-8">
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

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Riwayat Mutasi</CardTitle>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-11" onChange={(event) => setSearch(event.target.value)} placeholder="Cari mutasi..." value={search} />
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
                    <th className="px-4 py-3 font-semibold">Waktu</th>
                    <th className="px-4 py-3 font-semibold">Barang</th>
                    <th className="px-4 py-3 font-semibold">Jenis</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Lokasi Asal</th>
                    <th className="px-4 py-3 font-semibold">Lokasi Tujuan</th>
                    <th className="px-4 py-3 font-semibold">Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {new Date(item.performedAt).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.item?.name ?? "-"}</td>
                      <td className="px-4 py-4">
                        <StatusBadge map={MOVEMENT_TYPE_MAP} value={item.type} />
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.fromLocation?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.toLocation?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.performedBy?.name ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={() => setFormOpen(true)} variant="soft">
                  Tambah mutasi pertama
                </Button>
              }
              description="Belum ada riwayat mutasi barang."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Catat Mutasi / Transfer Barang">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Pilih Barang</span>
            <EntityPicker entityType="inventory-item" name="itemId" placeholder="Cari barang..." required />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jenis Mutasi</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="type"
                required
              >
                <option value="IN">Barang Masuk (IN)</option>
                <option value="OUT">Barang Keluar (OUT)</option>
                <option value="TRANSFER">Pindah Lokasi (TRANSFER)</option>
                <option value="DISPOSE">Afkir (DISPOSE)</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kuantitas</span>
              <Input defaultValue="1" name="quantity" type="number" min="1" required />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Dari Lokasi</span>
              <EntityPicker entityType="inventory-location" name="fromLocationId" placeholder="Cari lokasi asal..." />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Ke Lokasi</span>
              <EntityPicker entityType="inventory-location" name="toLocationId" placeholder="Cari lokasi tujuan..." />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Catatan Mutasi</span>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="note"
              rows={2}
            />
          </label>

          <div className="flex gap-3 justify-end mt-4">
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
