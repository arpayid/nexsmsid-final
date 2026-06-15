"use client";

import { Phase9ResourcePage } from "@/components/phase9-resource-page";

export default function DisciplineAchievementsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BK & Kedisiplinan", "Prestasi"]}
      columns={[
        { key: "awardedAt", label: "Tanggal", render: (row) => formatDate(row.awardedAt) },
        { key: "student.name", label: "Siswa" },
        { key: "title", label: "Prestasi" },
        { key: "category", label: "Kategori" },
        { key: "point", label: "Poin" },
      ]}
      create={(api, input) => api.createStudentAchievement(input)}
      delete={(api, id) => api.deleteStudentAchievement(id)}
      description="Catat prestasi dan poin positif siswa. Data ini otomatis masuk ringkasan kedisiplinan."
      eyebrow="Discipline"
      fields={[
        { label: "Siswa", name: "studentId", type: "entity", entityType: "student", required: true },
        { label: "Judul", name: "title", required: true },
        { label: "Kategori", name: "category", required: true },
        { label: "Poin", name: "point", required: true, type: "number" },
        { label: "Tanggal Penghargaan", name: "awardedAt", required: true, type: "date" },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={(api, query) => api.listStudentAchievements(query)}
      title="Prestasi"
      update={(api, id, input) => api.updateStudentAchievement(id, input)}
    />
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
