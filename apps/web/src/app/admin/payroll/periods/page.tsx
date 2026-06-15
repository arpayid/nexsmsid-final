"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { PageHeader, SectionCard, DataTable, Button, ErrorState, FormModal, Input } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

type PayrollPeriodRow = {
  id: string;
  code?: string;
  name?: string;
  month?: number;
  year?: number;
  paymentDate?: string;
  status?: string;
};

export default function Page() {
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const client = useMemo(() => createBrowserApiClient(), []);

  const loadItems = useCallback(async () => {
    const response = await client.listPayrollPeriods({ limit: 50, page: 1 });
    return (response as { data?: PayrollPeriodRow[] }).data ?? [];
  }, [client]);
  const { data: itemsData, error, loading, refetch, setError } = useApiQuery<PayrollPeriodRow[]>(loadItems, [client]);
  const items = itemsData ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      month: Number(formData.get("month")),
      year: Number(formData.get("year")),
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      paymentDate: (formData.get("paymentDate") as string) || undefined,
    };

    try {
      await client.createPayrollPeriod(payload);
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan periode penggajian");
    } finally {
      setSubmitting(false);
    }
  }

  async function runWorkflow(id: string, action: "open" | "calculate" | "approve" | "pay" | "close", confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setActionBusy(id);
    setError(null);
    try {
      if (action === "open") await client.openPayrollPeriod(id);
      else if (action === "calculate") await client.calculatePayrollPeriod(id);
      else if (action === "approve") await client.approvePayrollPeriod(id);
      else if (action === "pay") await client.payPayrollPeriod(id);
      else if (action === "close") await client.closePayrollPeriod(id);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan aksi periode");
    } finally {
      setActionBusy(null);
    }
  }

  const columns = [
    { key: "code", header: "Kode", cell: (item: PayrollPeriodRow) => String(item.code ?? "-") },
    { key: "name", header: "Nama Periode", cell: (item: PayrollPeriodRow) => String(item.name ?? "-") },
    { key: "month", header: "Bulan", cell: (item: PayrollPeriodRow) => String(item.month ?? "-") },
    { key: "year", header: "Tahun", cell: (item: PayrollPeriodRow) => String(item.year ?? "-") },
    { key: "paymentDate", header: "Tanggal Bayar", cell: (item: PayrollPeriodRow) => formatDate(item.paymentDate) },
    { key: "status", header: "Status", cell: (item: PayrollPeriodRow) => String(item.status ?? "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Periode Penggajian"
        description="Manajemen periode penggajian."
        breadcrumb={["Admin", "HR & Payroll", "Periode Penggajian"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Daftar Periode Penggajian">
        <DataTable
          actions={(item) => (
            <>
              {item.status === "DRAFT" ? (
                <Button disabled={actionBusy === item.id} onClick={() => void runWorkflow(item.id, "open")} size="sm" variant="soft">
                  {actionBusy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Buka
                </Button>
              ) : null}
              {item.status === "OPEN" ? (
                <Button disabled={actionBusy === item.id} onClick={() => void runWorkflow(item.id, "calculate")} size="sm" variant="soft">
                  Hitung
                </Button>
              ) : null}
              {item.status === "CALCULATED" ? (
                <Button disabled={actionBusy === item.id} onClick={() => void runWorkflow(item.id, "approve")} size="sm" variant="soft">
                  Setujui
                </Button>
              ) : null}
              {item.status === "APPROVED" ? (
                <Button
                  disabled={actionBusy === item.id}
                  onClick={() => void runWorkflow(item.id, "pay", "Konfirmasi pembayaran gaji untuk periode ini?")}
                  size="sm"
                  variant="soft"
                >
                  Bayar
                </Button>
              ) : null}
              {item.status === "PAID" ? (
                <Button
                  disabled={actionBusy === item.id}
                  onClick={() => void runWorkflow(item.id, "close", "Tutup periode ini? Periode yang ditutup tidak dapat diubah.")}
                  size="sm"
                  variant="outline"
                >
                  Tutup
                </Button>
              ) : null}
            </>
          )}
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{
            title: "Data kosong",
            description: "Belum ada data periode penggajian.",
          }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Periode Penggajian">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kode</span>
              <Input name="code" placeholder="Misal: JUN2026" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Nama Periode</span>
              <Input name="name" placeholder="Misal: Juni 2026" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Bulan (1-12)</span>
              <Input max={12} min={1} name="month" required type="number" defaultValue={new Date().getMonth() + 1} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tahun</span>
              <Input name="year" required type="number" defaultValue={new Date().getFullYear()} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tanggal Mulai</span>
              <Input name="startDate" required type="date" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tanggal Selesai</span>
              <Input name="endDate" required type="date" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tanggal Bayar (Opsional)</span>
              <Input name="paymentDate" type="date" />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
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

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleDateString("id-ID") : "-";
}
