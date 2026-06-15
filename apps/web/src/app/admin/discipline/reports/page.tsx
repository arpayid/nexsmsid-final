"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function DisciplineReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "BK & Kedisiplinan", "Laporan"]}
      description="Rekap pelanggaran dan ringkasan poin kedisiplinan siswa."
      eyebrow="Kedisiplinan"
      reports={[
        { code: "discipline-violation-recap", label: "Rekap Pelanggaran", description: "Pelanggaran tercatat per periode." },
        { code: "student-discipline-summary", label: "Ringkasan Siswa", description: "Akumulasi poin per siswa." },
        { code: "counseling-case-recap", label: "Rekap Kasus BK", description: "Kasus bimbingan konseling aktif dan selesai." },
      ]}
      title="Laporan Kedisiplinan & BK"
    />
  );
}
