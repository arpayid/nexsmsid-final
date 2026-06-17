"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, SectionCard, DataTable, Button, ErrorState, SearchFilterBar } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { RefreshCcw } from "lucide-react";

type PayrollRunRow = {
  id: string;
  employeeId?: string;
  periodId?: string;
  employee?: { fullName?: string };
  totalEarnings?: number;
  totalDeductions?: number;
  netAmount?: number;
  status?: string;
};

export default function Page() {
  const client = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const loadItems = useCallback(async () => {
    const response = await client.listPayrollRuns({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: PayrollRunRow[] }).data ?? [];
  }, [client, appliedSearch]);
  const { data: itemsData, error, loading, refetch } = useApiQuery<PayrollRunRow[]>(loadItems, [client, appliedSearch]);
  const items = itemsData ?? [];

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    await refetch();
  }

  const columns = [
    { key: "employee", header: "Pegawai", cell: (item: PayrollRunRow) => String(item.employee?.fullName ?? item.employeeId ?? "-") },
    { key: "periodId", header: "Periode", cell: (item: PayrollRunRow) => String(item.periodId ?? "-") },
    { key: "totalEarnings", header: "Penerimaan", cell: (item: PayrollRunRow) => formatCurrency(item.totalEarnings) },
    { key: "totalDeductions", header: "Potongan", cell: (item: PayrollRunRow) => formatCurrency(item.totalDeductions) },
    { key: "netAmount", header: "Gaji Bersih", cell: (item: PayrollRunRow) => formatCurrency(item.netAmount) },
    { key: "status", header: "Status", cell: (item: PayrollRunRow) => String(item.status ?? "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daftar Gaji (Payroll Run)"
        description="Manajemen daftar gaji (payroll run)."
        breadcrumb={["Admin", "HR & Payroll", "Daftar Gaji (Payroll Run)"]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/payroll/periods">Periode Penggajian</Link>
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
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari payroll run..."
            searchValue={search}
          />
        }
        title="Daftar Daftar Gaji (Payroll Run)"
      >
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{
            title: "Data kosong",
            description: "Belum ada data daftar gaji (payroll run).",
          }}
        />
      </SectionCard>
    </div>
  );
}

function formatCurrency(value: unknown) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}
