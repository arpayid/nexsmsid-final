"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];
const formats = ["CSV", "XLSX", "PDF", "JSON"];

export default function AdminReportJobsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Laporan", "Jobs"]}
      columns={[
        { key: "title", label: "Judul" },
        { key: "type", label: "Tipe" },
        { key: "format", label: "Format" },
        { key: "status", label: "Status" },
        { key: "resultUrl", label: "Hasil" },
      ]}
      create={(api, input) => api.createReportJob(input)}
      description="Pantau antrian laporan dan status pemrosesan."
      eyebrow="Laporan"
      fields={[
        { name: "type", label: "Tipe", required: true },
        { name: "title", label: "Judul" },
        { name: "format", label: "Format", type: "select", options: options(formats), required: true },
      ]}
      load={(api, params) => api.listReportJobs(params)}
      rowActions={[
        {
          label: "Download",
          run: async (api, row) => {
            const blob = await api.downloadReport(row.id as string);
            api.saveExcelBlob(blob, `report-${row.id}.xlsx`);
          },
          show: (row) => row.status === "COMPLETED",
          variant: "primary",
        },
        {
          label: "Cancel",
          run: (api, row) => api.cancelReportJob(row.id as string),
          show: (row) => row.status === "PENDING" || row.status === "PROCESSING",
          variant: "outline",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Report Jobs"
    />
  );
}
