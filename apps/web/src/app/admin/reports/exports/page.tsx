"use client";

import { Phase9ResourcePage } from "@/components/phase9-resource-page";

export default function AdminExportHistoryPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Laporan", "Export History"]}
      columns={[
        { key: "fileName", label: "File" },
        { key: "entity", label: "Entity" },
        { key: "format", label: "Format" },
        { key: "rowCount", label: "Rows" },
        { key: "createdAt", label: "Dibuat", render: (row) => String(row.createdAt ?? "-").slice(0, 10) },
      ]}
      description="Riwayat ekspor yang dihasilkan dari antrian laporan."
      eyebrow="Ekspor"
      load={(api, params) => api.listExportHistory(params)}
      rowActions={[
        {
          label: "Download",
          run: async (api, row) => {
            if (row.reportJobId) {
              const blob = await api.downloadReport(row.reportJobId as string);
              api.saveExcelBlob(blob, row.fileName as string);
            }
          },
          show: (row) => !!row.reportJobId,
          variant: "outline",
        },
      ]}
      title="Export History"
    />
  );
}
