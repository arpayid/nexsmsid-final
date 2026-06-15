"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function AcademicReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "Akademik", "Laporan"]}
      description="Rekap presensi, nilai, dan jadwal mengajar. Gunakan Report Center untuk filter lengkap."
      eyebrow="Akademik"
      reports={[
        { code: "students-by-class", label: "Siswa per Kelas", description: "Daftar siswa aktif per kelas." },
        { code: "attendance-class-recap", label: "Rekap Presensi Kelas", description: "Ringkasan kehadiran per kelas dan periode." },
        { code: "grades-class-recap", label: "Rekap Nilai Kelas", description: "Nilai per kelas dan mata pelajaran." },
        { code: "teacher-schedule-recap", label: "Jadwal Mengajar Guru", description: "Distribusi jam mengajar per guru." },
      ]}
      title="Laporan Akademik"
    />
  );
}
