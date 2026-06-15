"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function PpdbReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "PPDB", "Laporan"]}
      description="Rekap pendaftaran, status seleksi, dan konversi ke data siswa."
      eyebrow="PPDB"
      reports={[
        { code: "ppdb-registration-recap", label: "Rekap Pendaftaran", description: "Semua pendaftar per periode PPDB." },
        { code: "ppdb-status-recap", label: "Rekap Status", description: "Distribusi status verifikasi dan seleksi." },
        { code: "ppdb-conversion-recap", label: "Rekap Konversi Siswa", description: "Pendaftar yang sudah menjadi siswa." },
      ]}
      title="Laporan PPDB"
    />
  );
}
