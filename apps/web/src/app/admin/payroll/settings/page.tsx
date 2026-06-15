"use client";

import { useCallback, useMemo } from "react";
import { Info, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button, DataTable, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type PayrollEmployeeRow = {
  id: string;
  employeeCode?: string;
  fullName?: string;
  position?: { name?: string };
  basicSalary?: number;
  status?: string;
};

type PayrollComponentRow = {
  id: string;
  code?: string;
  name?: string;
  type?: string;
  defaultAmount?: number;
};

type PayrollSettingsData = {
  employees: PayrollEmployeeRow[];
  components: PayrollComponentRow[];
};

export default function PayrollSettingsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSettings = useCallback(async () => {
    const [employeeResponse, componentResponse] = await Promise.all([
      api.listEmployees({ limit: 50, page: 1 }),
      api.listPayrollComponents({ limit: 50, page: 1 }),
    ]);
    return {
      employees: (employeeResponse as { data?: PayrollEmployeeRow[] }).data ?? [],
      components: (componentResponse as { data?: PayrollComponentRow[] }).data ?? [],
    };
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery<PayrollSettingsData>(loadSettings, [api]);
  const employees = data?.employees ?? [];
  const components = data?.components ?? [];

  const employeeColumns = [
    { key: "employeeCode", header: "Kode Pegawai", cell: (item: PayrollEmployeeRow) => String(item.employeeCode ?? "-") },
    { key: "fullName", header: "Nama Pegawai", cell: (item: PayrollEmployeeRow) => String(item.fullName ?? "-") },
    { key: "position", header: "Jabatan", cell: (item: PayrollEmployeeRow) => String(item.position?.name ?? "-") },
    { key: "basicSalary", header: "Gaji Pokok", cell: (item: PayrollEmployeeRow) => formatCurrency(item.basicSalary) },
    { key: "status", header: "Status", cell: (item: PayrollEmployeeRow) => String(item.status ?? "-") },
  ];

  const componentColumns = [
    { key: "code", header: "Kode", cell: (item: PayrollComponentRow) => String(item.code ?? "-") },
    { key: "name", header: "Komponen", cell: (item: PayrollComponentRow) => String(item.name ?? "-") },
    { key: "type", header: "Tipe", cell: (item: PayrollComponentRow) => String(item.type ?? "-") },
    { key: "defaultAmount", header: "Default", cell: (item: PayrollComponentRow) => formatCurrency(item.defaultAmount) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pengaturan Gaji Pegawai"
        description="Pantau gaji pokok pegawai dan komponen gaji aktif."
        breadcrumb={["Admin", "HR & Payroll", "Pengaturan Gaji"]}
        actions={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <div className="flex-1">Komponen gaji pegawai dapat dikelola dari detail data pegawai.</div>
        <Link
          href="/admin/hr/employees"
          className="shrink-0 whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Buka Data Pegawai
        </Link>
      </div>

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Gaji Pokok Pegawai">
        <DataTable
          columns={employeeColumns}
          data={employees}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada profil pegawai untuk pengaturan gaji." }}
        />
      </SectionCard>

      <SectionCard title="Komponen Gaji Tersedia">
        <DataTable
          columns={componentColumns}
          data={components}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada komponen gaji." }}
        />
      </SectionCard>
    </div>
  );
}

function formatCurrency(value: unknown) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}
