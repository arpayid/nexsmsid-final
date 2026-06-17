"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type PayrollPaymentRow = {
  id: string;
  payslipNumber?: string;
  paidAt?: string;
  paymentMethod?: string;
  status?: string;
  payrollRun?: {
    employee?: { fullName?: string };
    period?: { name?: string };
    netAmount?: number;
  };
};

export default function PayrollPaymentsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const loadPayments = useCallback(async () => {
    const response = await api.listPayrollPayments({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: PayrollPaymentRow[] }).data ?? [];
  }, [api, appliedSearch]);
  const { data: itemsData, error, loading, refetch } = useApiQuery<PayrollPaymentRow[]>(loadPayments, [api, appliedSearch]);
  const items = itemsData ?? [];

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    await refetch();
  }

  const columns = [
    { key: "payslipNumber", header: "Nomor Slip", cell: (item: PayrollPaymentRow) => String(item.payslipNumber ?? "-") },
    { key: "employee", header: "Pegawai", cell: (item: PayrollPaymentRow) => String(item.payrollRun?.employee?.fullName ?? "-") },
    { key: "period", header: "Periode", cell: (item: PayrollPaymentRow) => String(item.payrollRun?.period?.name ?? "-") },
    { key: "netAmount", header: "Gaji Bersih", cell: (item: PayrollPaymentRow) => formatCurrency(item.payrollRun?.netAmount) },
    { key: "paidAt", header: "Tanggal Bayar", cell: (item: PayrollPaymentRow) => formatDate(item.paidAt) },
    { key: "paymentMethod", header: "Metode", cell: (item: PayrollPaymentRow) => String(item.paymentMethod ?? "-") },
    { key: "status", header: "Status", cell: (item: PayrollPaymentRow) => String(item.status ?? "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pembayaran Payroll"
        description="Pantau pembayaran gaji berdasarkan payslip."
        breadcrumb={["Admin", "HR & Payroll", "Pembayaran Payroll"]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/payroll/runs">Daftar Gaji</Link>
            </Button>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari pembayaran..." searchValue={search} />
        }
        title="Daftar Pembayaran Payroll"
      >
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada payslip pembayaran payroll." }}
        />
      </SectionCard>
    </div>
  );
}

function formatCurrency(value: unknown) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleDateString("id-ID") : "-";
}
