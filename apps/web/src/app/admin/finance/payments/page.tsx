"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, Loader2, Plus, Printer, RefreshCcw, XCircle } from "lucide-react";

import type { PaymentRecord } from "@nexsmsid/api-client";
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

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "secondary" | "outline" }> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  VERIFIED: { label: "Terverifikasi", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "secondary" },
  CANCELLED: { label: "Dibatalkan", variant: "outline" },
};

type PaymentRow = PaymentRecord & { paymentDate?: string; student?: { name?: string } };

type PaymentConfirmAction = "cancel" | "verify";

export default function PaymentsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [pendingConfirm, setPendingConfirm] = useState<{ action: PaymentConfirmAction; item: PaymentRecord } | null>(null);
  const [rejectItem, setRejectItem] = useState<PaymentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadItems = useCallback(() => api.listPayments({ limit: 50, page: 1, search: appliedSearch || undefined }), [api, appliedSearch]);
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const items = (data?.items ?? []) as PaymentRow[];
  const total = data?.meta?.total ?? items.length;
  const error = actionError ?? fetchError;

  const statusInfo = useCallback((status: string) => PAYMENT_STATUS_MAP[status] ?? { label: status, variant: "outline" as const }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  function openCreate() {
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!pendingConfirm) return;
    const { action, item } = pendingConfirm;
    setActionError(null);
    try {
      if (action === "verify") await api.verifyPayment(item.id);
      else await api.cancelPayment(item.id);
      setPendingConfirm(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memproses pembayaran");
    }
  }

  async function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectItem) return;
    setRejectSubmitting(true);
    setActionError(null);
    try {
      await api.rejectPayment(rejectItem.id, { reason: rejectReason || undefined });
      setRejectItem(null);
      setRejectReason("");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menolak pembayaran");
    } finally {
      setRejectSubmitting(false);
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
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan pembayaran");
    } finally {
      setSubmitting(false);
    }
  }

  const confirmCopy: Record<PaymentConfirmAction, { description: string; title: string }> = {
    cancel: { description: "Batalkan pembayaran ini?", title: "Konfirmasi pembatalan" },
    verify: { description: "Verifikasi pembayaran ini?", title: "Konfirmasi verifikasi" },
  };

  const columns: DataTableColumn<PaymentRow>[] = [
    { cell: (row) => row.paymentNumber ?? "-", header: "No. Pembayaran", key: "paymentNumber" },
    { cell: (row) => row.invoice?.invoiceNumber ?? "-", header: "Invoice", key: "invoice" },
    { cell: (row) => row.student?.name ?? "-", header: "Siswa", key: "student" },
    { cell: (row) => `Rp ${Number(row.amount ?? 0).toLocaleString("id-ID")}`, header: "Jumlah", key: "amount" },
    { cell: (row) => row.method ?? "-", header: "Metode", key: "method" },
    {
      cell: (row) => {
        const status = row.status ?? "PENDING";
        const st = statusInfo(status);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
      header: "Status",
      key: "status",
    },
    {
      cell: (row) => {
        const date = row.paymentDate ?? row.paidAt;
        return date ? new Date(date).toLocaleDateString("id-ID") : "-";
      },
      header: "Tanggal",
      key: "date",
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
        breadcrumb={["Admin", "Keuangan", "Pembayaran"]}
        description="Kelola pembayaran invoice dari siswa."
        eyebrow="Keuangan"
        title="Pembayaran"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses pembayaran" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari pembayaran, invoice..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar pembayaran masuk. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Pembayaran"
      >
        <DataTable
          actions={(item) => {
            const status = item.status ?? "PENDING";
            return (
              <>
                {status === "PENDING" ? (
                  <>
                    <Button onClick={() => setPendingConfirm({ action: "verify", item })} size="sm" variant="soft">
                      <CheckCircle className="h-4 w-4" /> Verifikasi
                    </Button>
                    <Button
                      onClick={() => {
                        setRejectItem(item);
                        setRejectReason("");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4" /> Tolak
                    </Button>
                  </>
                ) : null}
                {status === "PENDING" || status === "VERIFIED" ? (
                  <Button onClick={() => setPendingConfirm({ action: "cancel", item })} size="sm" variant="ghost">
                    <XCircle className="h-4 w-4" /> Batalkan
                  </Button>
                ) : null}
                <Button disabled={printingId === item.id} onClick={() => void handlePrintReceipt(item)} size="sm" variant="soft">
                  {printingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Bukti
                </Button>
              </>
            );
          }}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah pembayaran pertama
              </Button>
            ),
            description: "Belum ada data pembayaran atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Catat pembayaran baru untuk invoice siswa."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title="Tambah Pembayaran"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Invoice</span>
            <EntityPicker entityType="invoice" name="invoiceId" placeholder="Cari invoice..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Jumlah</span>
            <Input min="0" name="amount" required type="number" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Metode Pembayaran</span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue=""
              name="method"
              required
            >
              <option disabled value="">
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
            <span className="text-sm font-semibold text-foreground">URL Bukti Pembayaran</span>
            <Input name="proofUrl" placeholder="https://..." type="url" />
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Catatan</span>
              <textarea
                className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

      <FormModal
        description="Berikan alasan penolakan pembayaran (opsional)."
        onClose={() => {
          setRejectItem(null);
          setRejectReason("");
        }}
        open={Boolean(rejectItem)}
        title="Tolak Pembayaran"
      >
        <form className="grid gap-4" onSubmit={handleRejectSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Alasan</span>
            <Input onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan..." value={rejectReason} />
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={() => {
                setRejectItem(null);
                setRejectReason("");
              }}
              type="button"
              variant="outline"
            >
              Batal
            </Button>
            <Button disabled={rejectSubmitting} type="submit" variant="destructive">
              {rejectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Tolak Pembayaran
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
