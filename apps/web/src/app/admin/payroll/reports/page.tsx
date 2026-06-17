"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { FileText, Loader2, RefreshCcw } from "lucide-react";

import { Button, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ReportTypeRow = {
  code: string;
  name?: string;
  category?: string;
  supportedFormats?: string[];
};

type ReportJobRow = {
  id: string;
  type?: string;
  title?: string;
  format?: string;
  status?: string;
  createdAt?: string;
};

type PayrollReportsData = {
  reports: ReportTypeRow[];
  jobs: ReportJobRow[];
};

export default function PayrollReportsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const loadReports = useCallback(async () => {
    const [types, jobResponse] = await Promise.all([api.listReportTypes(), api.listReportJobs({ limit: 10, page: 1 })]);
    return {
      reports: (types as ReportTypeRow[]).filter((report) => report.category === "HR" || report.category === "Payroll"),
      jobs: (jobResponse.items as ReportJobRow[]).filter(
        (job) => String(job.type).startsWith("hr-") || String(job.type).startsWith("payroll-"),
      ),
    };
  }, [api]);
  const { data, error, loading, refetch, setError } = useApiQuery<PayrollReportsData>(loadReports, [api]);
  const reports = (data?.reports ?? []).filter((item) => matchesSearch(item, search));
  const jobs = data?.jobs ?? [];

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }
  async function generateEmployeeRecap() {
    setSubmitting(true);
    setError(null);
    try {
      await api.generateReport({ type: "hr-employee-recap", format: "CSV", title: "HR Employee Recap" });
      await refetch();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal generate laporan HR/payroll");
    } finally {
      setSubmitting(false);
    }
  }

  const reportColumns = [
    { key: "code", header: "Kode", cell: (item: ReportTypeRow) => String(item.code ?? "-") },
    { key: "name", header: "Nama Laporan", cell: (item: ReportTypeRow) => String(item.name ?? "-") },
    { key: "category", header: "Kategori", cell: (item: ReportTypeRow) => String(item.category ?? "-") },
    { key: "supportedFormats", header: "Format", cell: (item: ReportTypeRow) => (item.supportedFormats ?? []).join(", ") || "-" },
  ];

  const jobColumns = [
    { key: "type", header: "Tipe", cell: (item: ReportJobRow) => String(item.type ?? "-") },
    { key: "title", header: "Judul", cell: (item: ReportJobRow) => String(item.title ?? "-") },
    { key: "format", header: "Format", cell: (item: ReportJobRow) => String(item.format ?? "-") },
    { key: "status", header: "Status", cell: (item: ReportJobRow) => String(item.status ?? "-") },
    { key: "createdAt", header: "Dibuat", cell: (item: ReportJobRow) => formatDate(item.createdAt) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan HR & Payroll"
        description="Daftar report engine untuk HR, payroll, pembayaran, dan payslip."
        breadcrumb={["Admin", "HR & Payroll", "Laporan"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button disabled={submitting} onClick={generateEmployeeRecap}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate Rekap Pegawai
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
            searchPlaceholder="Cari tipe laporan..."
            searchValue={search}
          />
        }
        title="Report Type HR & Payroll"
      >
        <DataTable
          columns={reportColumns}
          data={reports}
          loading={loading}
          getRowId={(item) => item.code}
          emptyState={{ title: "Data kosong", description: "Belum ada report type HR/payroll." }}
        />
      </SectionCard>

      <SectionCard title="Job Laporan Terbaru">
        <DataTable
          columns={jobColumns}
          data={jobs}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada job laporan HR/payroll." }}
        />
      </SectionCard>
    </div>
  );
}

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleString("id-ID") : "-";
}

function matchesSearch(item: Record<string, unknown>, search: string) {
  if (!search.trim()) return true;
  const needle = search.toLowerCase();
  return (
    String(item.code ?? "")
      .toLowerCase()
      .includes(needle) ||
    String(item.name ?? "")
      .toLowerCase()
      .includes(needle)
  );
}
