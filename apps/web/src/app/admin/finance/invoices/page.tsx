"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, FileText, Loader2, Plus, Printer, RefreshCcw, Trash2, X } from "lucide-react";

import type { InvoiceRecord } from "@nexsmsid/api-client";
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

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const INVOICE_STATUS_MAP: Record<string, { label: string; variant: "outline" | "info" | "warning" | "success" | "secondary" }> = {
  DRAFT: { label: "Draf", variant: "outline" },
  ISSUED: { label: "Diterbitkan", variant: "info" },
  PARTIAL: { label: "Sebagian Dibayar", variant: "warning" },
  PAID: { label: "Lunas", variant: "success" },
  OVERDUE: { label: "Jatuh Tempo", variant: "warning" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

type InvoiceRow = InvoiceRecord & {
  paidAmount?: number;
  penalty?: number;
  student?: { name?: string };
  subtotal?: number;
  total?: number;
};

type InvoiceConfirmAction = "cancel" | "delete" | "issue";

export default function InvoicesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<InvoiceRecord | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: InvoiceConfirmAction; item: InvoiceRecord } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);

  const loadItems = useCallback(() => api.listInvoices({ limit: 50, page: 1, search: appliedSearch || undefined }), [api, appliedSearch]);
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const items = (data?.items ?? []) as InvoiceRow[];
  const total = data?.meta?.total ?? items.length;
  const error = actionError ?? fetchError;

  const statusInfo = useCallback((status: string) => INVOICE_STATUS_MAP[status] ?? { label: status, variant: "outline" as const }, []);

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
    setInvoiceItems([{ name: "", quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }

  function openEdit(item: InvoiceRecord) {
    setEditing(item);
    const existingItems = item.items as Array<{ name: string; quantity: number; unitPrice: number }> | undefined;
    setInvoiceItems(existingItems && existingItems.length > 0 ? existingItems : [{ name: "", quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    try {
      if (action === "issue") await api.issueInvoice(item.id);
      else if (action === "cancel") await api.cancelInvoice(item.id);
      else await api.deleteInvoice(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memproses invoice");
    }
  }

  async function handlePrintInvoice(item: InvoiceRecord) {
    setActionError(null);
    setPrintingId(item.id);
    try {
      const blob = await api.downloadInvoicePdf(item.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "Gagal membuat PDF invoice");
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
      studentId: formData.get("studentId"),
      items: invoiceItems.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
      discount: formData.get("discount") ? Number(formData.get("discount")) : 0,
      penalty: formData.get("penalty") ? Number(formData.get("penalty")) : 0,
      note: formData.get("note") || undefined,
    };

    try {
      if (editing) {
        const { studentId: _studentId, items: _items, ...updatePayload } = payload;
        await api.updateInvoice(editing.id, updatePayload);
      } else {
        await api.createInvoice(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan invoice");
    } finally {
      setSubmitting(false);
    }
  }

  const confirmCopy: Record<InvoiceConfirmAction, { description: string; title: string }> = {
    cancel: { description: "Batalkan invoice ini?", title: "Konfirmasi pembatalan" },
    delete: { description: "Hapus invoice ini? Tindakan tidak dapat dibatalkan.", title: "Konfirmasi hapus" },
    issue: { description: "Terbitkan invoice ini?", title: "Konfirmasi penerbitan" },
  };

  const formatRp = (value: number) => `Rp ${Number(value).toLocaleString("id-ID")}`;

  const columns: DataTableColumn<InvoiceRow>[] = [
    { cell: (row) => row.invoiceNumber ?? "-", header: "No. Invoice", key: "invoiceNumber" },
    { cell: (row) => row.student?.name ?? "-", header: "Siswa", key: "student" },
    { cell: (row) => formatRp(row.subtotal ?? 0), header: "Subtotal", key: "subtotal" },
    { cell: (row) => formatRp(row.discount ?? 0), header: "Diskon", key: "discount" },
    { cell: (row) => formatRp(row.penalty ?? 0), header: "Denda", key: "penalty" },
    { cell: (row) => formatRp(row.total ?? 0), header: "Total", key: "total" },
    { cell: (row) => formatRp(row.paidAmount ?? 0), header: "Dibayar", key: "paidAmount" },
    {
      cell: (row) => {
        const status = row.status ?? "DRAFT";
        const st = statusInfo(status);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
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
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Keuangan", "Invoice"]}
        description="Kelola penerbitan invoice dan tagihan siswa."
        eyebrow="Keuangan"
        title="Invoice"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses invoice" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari invoice, siswa..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar tagihan siswa. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Invoice"
      >
        <DataTable
          actions={(item) => {
            const status = item.status ?? "DRAFT";
            return (
              <>
                {status === "DRAFT" ? (
                  <>
                    <Button onClick={() => setPendingConfirm({ action: "issue", item })} size="sm" variant="soft">
                      <FileText className="h-4 w-4" /> Terbitkan
                    </Button>
                    <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={() => setPendingConfirm({ action: "delete", item })} size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </>
                ) : null}
                <Button disabled={printingId === item.id} onClick={() => void handlePrintInvoice(item)} size="sm" variant="soft">
                  {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Cetak PDF
                </Button>
                {status === "ISSUED" || status === "PARTIAL" ? (
                  <Button onClick={() => setPendingConfirm({ action: "cancel", item })} size="sm" variant="ghost">
                    <X className="h-4 w-4" /> Batalkan
                  </Button>
                ) : null}
              </>
            );
          }}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah invoice pertama
              </Button>
            ),
            description: "Belum ada data invoice atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Tambahkan siswa, item tagihan, diskon, dan denda."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={editing ? "Edit Invoice" : "Tambah Invoice"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Siswa</span>
            <EntityPicker
              defaultValue={editing?.studentId ?? ""}
              entityType="student"
              name="studentId"
              placeholder="Cari siswa..."
              required
            />
          </label>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Items</span>
              <Button
                onClick={() => setInvoiceItems([...invoiceItems, { name: "", quantity: 1, unitPrice: 0 }])}
                size="sm"
                type="button"
                variant="soft"
              >
                <Plus className="mr-1 h-4 w-4" /> Tambah Item
              </Button>
            </div>
            {invoiceItems.map((item, index) => (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-muted p-3" key={index}>
                <div className="flex-1">
                  <Input
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].name = e.target.value;
                      setInvoiceItems(newItems);
                    }}
                    placeholder="Nama item (contoh: SPP Juli)"
                    required
                    value={item.name}
                  />
                </div>
                <div className="w-24">
                  <Input
                    min="1"
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].quantity = Number(e.target.value);
                      setInvoiceItems(newItems);
                    }}
                    placeholder="Qty"
                    required
                    type="number"
                    value={item.quantity}
                  />
                </div>
                <div className="w-40">
                  <Input
                    min="0"
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].unitPrice = Number(e.target.value);
                      setInvoiceItems(newItems);
                    }}
                    placeholder="Harga"
                    required
                    type="number"
                    value={item.unitPrice}
                  />
                </div>
                <Button
                  className="mt-0 shrink-0"
                  disabled={invoiceItems.length === 1}
                  onClick={() => {
                    const newItems = [...invoiceItems];
                    newItems.splice(index, 1);
                    setInvoiceItems(newItems);
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Diskon</span>
            <Input defaultValue={String(editing?.discount ?? "0")} min="0" name="discount" type="number" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Denda</span>
            <Input defaultValue={String(editing?.penalty ?? "0")} min="0" name="penalty" type="number" />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Catatan</span>
              <textarea
                className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                defaultValue={editing?.note ?? ""}
                name="note"
                rows={2}
              />
            </label>
          </div>
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
        description={pendingConfirm ? confirmCopy[pendingConfirm.action].description : ""}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmAction()}
        open={Boolean(pendingConfirm)}
        title={pendingConfirm ? confirmCopy[pendingConfirm.action].title : "Konfirmasi"}
      />
    </div>
  );
}
