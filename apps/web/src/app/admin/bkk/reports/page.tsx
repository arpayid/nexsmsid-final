"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function BkkReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "BKK", "Laporan"]}
      description="Rekap PKL, mitra industri, alumni, lowongan kerja, dan tracer study."
      eyebrow="BKK"
      reports={[
        { code: "internship-recap", label: "Rekap PKL", description: "Data penempatan PKL per periode.", format: "XLSX" },
        { code: "industry-partner-recap", label: "Rekap Mitra Industri", description: "Daftar mitra dan status kerjasama." },
        { code: "alumni-recap", label: "Rekap Alumni", description: "Data alumni per tahun lulus dan status karier." },
        { code: "job-application-recap", label: "Rekap Lamaran Kerja", description: "Lamaran BKK per periode.", format: "XLSX" },
        { code: "tracer-study-recap", label: "Rekap Tracer Study", description: "Hasil pelacakan alumni per tahun." },
      ]}
      title="Laporan BKK & PKL"
    />
  );
}
