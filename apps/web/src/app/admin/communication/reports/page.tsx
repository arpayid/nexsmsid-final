"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function CommunicationReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "Komunikasi", "Laporan"]}
      description="Rekap pengumuman dan notifikasi yang dikirim sistem."
      eyebrow="Komunikasi"
      reports={[
        {
          code: "announcement-recap",
          label: "Rekap Pengumuman",
          description: "Pengumuman per periode dan status publikasi.",
          format: "XLSX",
        },
        {
          code: "notification-recap",
          label: "Rekap Notifikasi",
          description: "Notifikasi terkirim per channel dan status.",
          format: "XLSX",
        },
      ]}
      title="Laporan Komunikasi"
    />
  );
}
