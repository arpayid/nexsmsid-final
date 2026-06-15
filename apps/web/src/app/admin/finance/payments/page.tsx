"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Plus, Printer, RefreshCcw, Search, X, XCircle } from "lucide-react";

import type { PaymentRecord } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "secondary" | "outline" }> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  VERIFIED: { label: "Terverifikasi", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "secondary" },
  CANCELLED: { label: "Dibatalkan", variant: "outline" },
};

export default function PaymentsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadItems = useCallback(() => api.listPayments({ limit: 50, page: 1, search: appliedSearch || undefined }), [api, appliedSearch]);
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
    setFormOpen(true);
  }

  async function handleVerify(item: PaymentRecord) {
    const confirmed = window.confirm("Verifikasi pembayaran ini?");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.verifyPayment(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memverifikasi pembayaran");
    }
  }

  async function handleReject(item: PaymentRecord) {
    const reason = window.prompt("Alasan penolakan:");
    if (reason === null) return;
    setActionError(null);
    try {
      await api.rejectPayment(item.id, { reason: reason || undefined });
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menolak pembayaran");
    }
  }

  async function handleCancel(item: PaymentRecord) {
    const confirmed = window.confirm("Batalkan pembayaran ini?");
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.cancelPayment(item.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan pembayaran");
    }
  }

  async function handlePrintReceipt(item: PaymentRecord) {
    setActionError(null);
    setPrintingId(item.id);
    try {
      const blob = await api.downloadPaymentReceiptPdf(item.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "Gagal membuat bukti pembayaran");
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
      invoiceId: formData.get("invoiceId"),
      amount: Number(formData.get("amount")),
      method: formData.get("method"),
      proofUrl: (formData.get("proofUrl") as string) || undefined,
      note: (formData.get("note") as string) || undefined,
    };
    try {
      await api.createPayment(payload);
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan pembayaran");
    } finally {
      setSubmitting(false);
    }
  }

  const statusInfo = (status: string) => PAYMENT_STATUS_MAP[status] ?? { label: status, variant: "outline" as const };

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
        breadcrumb={["Admin", "Keuangan", "Pembayaran"]}
        description="Kelola pembayaran invoice dari siswa."
        eyebrow="Keuangan"
        title="Pembayaran"
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
              <CardTitle>Data Pembayaran</CardTitle>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total: {total} data</p>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari pembayaran, invoice..."
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
                    <th className="px-4 py-3 font-semibold">No. Pembayaran</th>
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Siswa</th>
                    <th className="px-4 py-3 font-semibold">Jumlah</th>
                    <th className="px-4 py-3 font-semibold">Metode</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const row = item as PaymentRecord & { paymentDate?: string; student?: { name?: string } };
                    const status = row.status ?? "PENDING";
                    const st = statusInfo(status);
                    return (
                      <tr className="border-b last:border-0" key={item.id}>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.paymentNumber ?? "-"}</td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.invoice?.invoiceNumber ?? "-"}</td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.student?.name ?? "-"}</td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          Rp {Number(row.amount ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">{row.method ?? "-"}</td>
                        <td className="px-4 py-4">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground">
                          {row.paymentDate
                            ? new Date(row.paymentDate).toLocaleDateString("id-ID")
                            : row.paidAt
                              ? new Date(row.paidAt).toLocaleDateString("id-ID")
                              : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {status === "PENDING" ? (
                              <>
                                <Button onClick={() => handleVerify(item)} size="sm" variant="soft">
                                  <CheckCircle className="h-4 w-4" /> Verifikasi
                                </Button>
                                <Button onClick={() => handleReject(item)} size="sm" variant="outline">
                                  <XCircle className="h-4 w-4" /> Tolak
                                </Button>
                              </>
                            ) : null}
                            {status === "PENDING" || status === "VERIFIED" ? (
                              <Button onClick={() => handleCancel(item)} size="sm" variant="ghost">
                                <XCircle className="h-4 w-4" /> Batalkan
                              </Button>
                            ) : null}
                            <Button disabled={printingId === item.id} onClick={() => handlePrintReceipt(item)} size="sm" variant="soft">
                              {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                              Bukti
                            </Button>
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
                  Tambah pembayaran pertama
                </Button>
              }
              description="Belum ada data pembayaran."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Pembayaran">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Invoice</span>
            <EntityPicker entityType="invoice" name="invoiceId" placeholder="Cari invoice..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Jumlah</span>
            <Input name="amount" type="number" min="0" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Metode Pembayaran</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="method"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Pilih Metode
              </option>
              <option value="CASH">Tunai</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="VA">Virtual Account</option>
              <option value="QRIS">QRIS</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">URL Bukti Pembayaran</span>
            <Input name="proofUrl" placeholder="https://..." type="url" />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Catatan</span>
              <textarea
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
