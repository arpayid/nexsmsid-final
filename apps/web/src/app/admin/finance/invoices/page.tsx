"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, Edit3, FileText, Loader2, Plus, Printer, RefreshCcw, Search, Trash2, X } from "lucide-react";

import type { InvoiceRecord } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";

const INVOICE_STATUS_MAP: Record<string, { label: string; variant: "outline" | "info" | "warning" | "success" | "secondary" }> = {
  DRAFT: { label: "Draf", variant: "outline" },
  ISSUED: { label: "Diterbitkan", variant: "info" },
  PARTIAL: { label: "Sebagian Dibayar", variant: "warning" },
  PAID: { label: "Lunas", variant: "success" },
  OVERDUE: { label: "Jatuh Tempo", variant: "warning" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

export default function InvoicesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<InvoiceRecord | null>(null);
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
  const items = data?.items ?? [];
  const total = data?.meta?.total ?? items.length;
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
    setInvoiceItems([{ name: "", quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }

  function openEdit(item: InvoiceRecord) {
    setEditing(item);
    const existingItems = item.items as Array<{ name: string; quantity: number; unitPrice: number }> | undefined;
    setInvoiceItems(existingItems && existingItems.length > 0 ? existingItems : [{ name: "", quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }

  async function handleIssue(item: InvoiceRecord) {
    const confirmed = window.confirm("Terbitkan invoice ini?");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.issueInvoice(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menerbitkan invoice");
    }
  }

  async function handleCancel(item: InvoiceRecord) {
    const confirmed = window.confirm("Batalkan invoice ini?");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.cancelInvoice(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan invoice");
    }
  }

  async function handleDelete(item: InvoiceRecord) {
    const confirmed = window.confirm("Hapus invoice ini? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.deleteInvoice(item.id);
      await refetch();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus invoice");
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

  const statusInfo = (status: string) => INVOICE_STATUS_MAP[status] ?? { label: status, variant: "outline" as const };

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
        breadcrumb={["Admin", "Keuangan", "Invoice"]}
        description="Kelola penerbitan invoice dan tagihan siswa."
        eyebrow="Keuangan"
        title="Invoice"
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
              <CardTitle>Data Invoice</CardTitle>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total: {total} data</p>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari invoice, siswa..."
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
                    <th className="px-4 py-3 font-semibold">No. Invoice</th>
                    <th className="px-4 py-3 font-semibold">Siswa</th>
                    <th className="px-4 py-3 font-semibold">Subtotal</th>
                    <th className="px-4 py-3 font-semibold">Diskon</th>
                    <th className="px-4 py-3 font-semibold">Denda</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Dibayar</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const row = item as InvoiceRecord & {
                      student?: { name?: string };
                      subtotal?: number;
                      discount?: number;
                      penalty?: number;
                      total?: number;
                      paidAmount?: number;
                    };
                    const status = row.status ?? "DRAFT";
                    const st = statusInfo(status);
                    return (
                      <tr className="border-b last:border-0" key={item.id}>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.invoiceNumber ?? "-"}</td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.student?.name ?? "-"}</td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.subtotal ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.discount ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.penalty ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.total ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.paidAmount ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {status === "DRAFT" ? (
                              <>
                                <Button onClick={() => handleIssue(item)} size="sm" variant="soft">
                                  <FileText className="h-4 w-4" /> Terbitkan
                                </Button>
                                <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                                  <Edit3 className="h-4 w-4" /> Edit
                                </Button>
                                <Button onClick={() => handleDelete(item)} size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4" /> Hapus
                                </Button>
                              </>
                            ) : null}
                            <Button disabled={printingId === item.id} onClick={() => handlePrintInvoice(item)} size="sm" variant="soft">
                              {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                              Cetak PDF
                            </Button>
                            {status === "ISSUED" || status === "PARTIAL" ? (
                              <Button onClick={() => handleCancel(item)} size="sm" variant="ghost">
                                <X className="h-4 w-4" /> Batalkan
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={openCreate} variant="soft">
                  Tambah invoice pertama
                </Button>
              }
              description="Belum ada data invoice."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title={editing ? "Edit Invoice" : "Tambah Invoice"}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Siswa</span>
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
              <span className="text-sm font-bold text-muted-foreground">Items</span>
              <Button
                type="button"
                onClick={() => setInvoiceItems([...invoiceItems, { name: "", quantity: 1, unitPrice: 0 }])}
                size="sm"
                variant="soft"
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Item
              </Button>
            </div>
            {invoiceItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start bg-surface-muted p-3 rounded-xl border border-border">
                <div className="flex-1">
                  <Input
                    placeholder="Nama item (contoh: SPP Juli)"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].name = e.target.value;
                      setInvoiceItems(newItems);
                    }}
                    required
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].quantity = Number(e.target.value);
                      setInvoiceItems(newItems);
                    }}
                    required
                  />
                </div>
                <div className="w-40">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Harga"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newItems = [...invoiceItems];
                      newItems[index].unitPrice = Number(e.target.value);
                      setInvoiceItems(newItems);
                    }}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const newItems = [...invoiceItems];
                    newItems.splice(index, 1);
                    setInvoiceItems(newItems);
                  }}
                  disabled={invoiceItems.length === 1}
                  className="mt-0 shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Diskon</span>
            <Input defaultValue={String(editing?.discount ?? "0")} name="discount" type="number" min="0" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Denda</span>
            <Input defaultValue={String(editing?.penalty ?? "0")} name="penalty" type="number" min="0" />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Catatan</span>
              <textarea
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                defaultValue={editing?.note ?? ""}
                name="note"
                rows={2}
              />
            </label>
          </div>
          <div className="flex gap-3 md:col-span-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
