"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader, SectionCard, DataTable, Button, ErrorState } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { RefreshCcw } from "lucide-react";

type PayslipRow = {
  id: string;
  payslipNumber?: string;
  status?: string;
  issuedAt?: string;
  payrollRun?: {
    employee?: { fullName?: string };
    period?: { name?: string };
  };
};

export default function Page() {
  const client = useMemo(() => createBrowserApiClient(), []);
  const loadItems = useCallback(async () => {
    const response = await client.listPayslips({ limit: 50, page: 1 });
    return (response as { data?: PayslipRow[] }).data ?? [];
  }, [client]);
  const { data: itemsData, error, loading, refetch } = useApiQuery<PayslipRow[]>(loadItems, [client]);
  const items = itemsData ?? [];

  const columns = [
    { key: "payslipNumber", header: "Nomor Slip", cell: (item: PayslipRow) => String(item.payslipNumber ?? "-") },
    { key: "employee", header: "Pegawai", cell: (item: PayslipRow) => String(item.payrollRun?.employee?.fullName ?? "-") },
    { key: "period", header: "Periode", cell: (item: PayslipRow) => String(item.payrollRun?.period?.name ?? "-") },
    { key: "status", header: "Status", cell: (item: PayslipRow) => String(item.status ?? "-") },
    { key: "issuedAt", header: "Tgl Terbit", cell: (item: PayslipRow) => formatDate(item.issuedAt) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Slip Gaji"
        description="Manajemen slip gaji."
        breadcrumb={["Admin", "HR & Payroll", "Slip Gaji"]}
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

      <SectionCard title="Daftar Slip Gaji">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{
            title: "Data kosong",
            description: "Belum ada data slip gaji.",
          }}
        />
      </SectionCard>
    </div>
  );
}

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleDateString("id-ID") : "-";
}
