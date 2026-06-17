"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Trash2, Loader2, PlayCircle, CheckCircle2, XCircle } from "lucide-react";

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

type InventoryMaintenanceRow = {
  id: string;
  itemId?: string;
  title?: string;
  description?: string;
  scheduledAt?: string;
  cost?: number;
  vendor?: string;
  status?: string;
  item?: { name?: string };
};

type StatusMapEntry = {
  label: string;
  variant: "success" | "warning" | "info" | "secondary" | "outline";
};

type MaintenanceConfirmAction = "start" | "complete" | "cancel" | "delete";

const MAINT_STATUS_MAP: Record<string, StatusMapEntry> = {
  SCHEDULED: { label: "Terjadwal", variant: "outline" },
  IN_PROGRESS: { label: "Sedang Berjalan", variant: "warning" },
  COMPLETED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

const CONFIRM_COPY: Record<MaintenanceConfirmAction, { description: string; title: string }> = {
  start: { description: "Mulai pemeliharaan barang ini?", title: "Konfirmasi mulai" },
  complete: { description: "Tandai pemeliharaan sebagai selesai?", title: "Konfirmasi selesai" },
  cancel: { description: "Batalkan jadwal pemeliharaan ini?", title: "Konfirmasi pembatalan" },
  delete: { description: "Hapus data pemeliharaan ini? Tindakan tidak dapat dibatalkan.", title: "Konfirmasi hapus" },
};

const SELECT_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function InventoryMaintenancesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryMaintenanceRow | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: MaintenanceConfirmAction; item: InventoryMaintenanceRow } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMaintenances = useCallback(async () => {
    const response = await api.getInventoryMaintenances({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: InventoryMaintenanceRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const {
    data: itemsData,
    error: fetchError,
    loading,
    refetch,
  } = useApiQuery<InventoryMaintenanceRow[]>(loadMaintenances, [api, appliedSearch]);
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

  function openEdit(item: InventoryMaintenanceRow) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    try {
      if (action === "start") await api.startInventoryMaintenance(item.id);
      else if (action === "complete") await api.completeInventoryMaintenance(item.id);
      else if (action === "cancel") await api.cancelInventoryMaintenance(item.id);
      else await api.deleteInventoryMaintenance(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memproses aksi pemeliharaan");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);

    const payload: Record<string, unknown> = {
      itemId: formData.get("itemId"),
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      scheduledAt: formData.get("scheduledAt") ? new Date(formData.get("scheduledAt") as string).toISOString() : undefined,
      cost: formData.get("cost") ? Number(formData.get("cost")) : undefined,
      vendor: formData.get("vendor") || undefined,
    };

    try {
      if (editing) {
        await api.updateInventoryMaintenance(editing.id, payload);
      } else {
        await api.createInventoryMaintenance(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan pemeliharaan");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<InventoryMaintenanceRow>[] = [
    {
      cell: (item) => (item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString("id-ID") : "-"),
      header: "Jadwal",
      key: "scheduledAt",
    },
    { cell: (item) => item.title ?? "-", header: "Tiket / Judul", key: "title" },
    { cell: (item) => item.item?.name ?? "-", header: "Barang", key: "item" },
    {
      cell: (item) => (
        <>
          {item.vendor || "-"}
          <br />
          <span className="font-normal text-muted-foreground">Rp {Number(item.cost ?? 0).toLocaleString("id-ID")}</span>
        </>
      ),
      header: "Vendor/Biaya",
      key: "vendor",
    },
    {
      cell: (item) => <StatusBadge map={MAINT_STATUS_MAP} value={item.status} />,
      header: "Status",
      key: "status",
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
              <Plus className="h-4 w-4" /> Jadwalkan Pemeliharaan
            </Button>
          </>
        }
        breadcrumb={["Admin", "Inventaris", "Pemeliharaan"]}
        description="Jadwal servis, pemeliharaan rutin, dan catatan biaya."
        eyebrow="Sarpras"
        title="Pemeliharaan Barang"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses pemeliharaan" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari tiket..." searchValue={search} />
        }
        description={
          <>
            Riwayat pemeliharaan barang. Total: <strong>{total}</strong> data.
          </>
        }
        title="Riwayat Pemeliharaan"
      >
        <DataTable
          actions={(item) => (
            <>
              {item.status === "SCHEDULED" ? (
                <>
                  <Button onClick={() => setPendingConfirm({ action: "start", item })} size="sm" variant="soft" aria-label="Mulai">
                    <PlayCircle className="h-4 w-4" /> Mulai
                  </Button>
                  <Button onClick={() => openEdit(item)} size="sm" variant="outline" aria-label="Edit">
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={() => setPendingConfirm({ action: "cancel", item })} size="sm" variant="ghost" aria-label="Batal">
                    <XCircle className="h-4 w-4" /> Batal
                  </Button>
                </>
              ) : item.status === "IN_PROGRESS" ? (
                <Button onClick={() => setPendingConfirm({ action: "complete", item })} size="sm" variant="soft" aria-label="Selesai">
                  <CheckCircle2 className="h-4 w-4" /> Selesai
                </Button>
              ) : null}
              <Button onClick={() => setPendingConfirm({ action: "delete", item })} size="sm" variant="ghost" aria-label="Hapus">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Jadwalkan pemeliharaan pertama
              </Button>
            ),
            description: "Belum ada data pemeliharaan atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi detail jadwal pemeliharaan barang."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={`${editing ? "Edit" : "Jadwalkan"} Pemeliharaan`}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Pilih Barang</span>
            <EntityPicker
              defaultValue={editing?.itemId ?? ""}
              entityType="inventory-item"
              name="itemId"
              placeholder="Cari barang..."
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Judul / Pekerjaan</span>
            <Input defaultValue={editing?.title ?? ""} name="title" required />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Tanggal Terjadwal</span>
              <Input
                defaultValue={editing?.scheduledAt ? new Date(editing.scheduledAt).toISOString().split("T")[0] : ""}
                name="scheduledAt"
                type="date"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Estimasi Biaya</span>
              <Input defaultValue={editing?.cost ?? ""} name="cost" type="number" min="0" />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Vendor / Teknisi</span>
            <Input defaultValue={editing?.vendor ?? ""} name="vendor" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Deskripsi Pekerjaan</span>
            <textarea className={SELECT_CLASS} defaultValue={editing?.description ?? ""} name="description" rows={3} />
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
        description={pendingConfirm ? CONFIRM_COPY[pendingConfirm.action].description : ""}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmAction()}
        open={Boolean(pendingConfirm)}
        title={pendingConfirm ? CONFIRM_COPY[pendingConfirm.action].title : "Konfirmasi"}
      />
    </div>
  );
}
