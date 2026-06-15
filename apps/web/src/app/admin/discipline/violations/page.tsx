"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statusOptions = options(["DRAFT", "CONFIRMED", "CANCELLED"]);

export default function DisciplineViolationsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BK & Kedisiplinan", "Pelanggaran"]}
      columns={[
        { key: "incidentDate", label: "Tanggal", render: (row) => formatDate(row.incidentDate) },
        { key: "student.name", label: "Siswa" },
        { key: "rule.name", label: "Aturan" },
        { key: "rule.severity", label: "Severity" },
        { key: "point", label: "Poin" },
        { key: "status", label: "Status" },
      ]}
      create={(api, input) => api.createDisciplineViolation(input)}
      delete={(api, id) => api.deleteDisciplineViolation(id)}
      description="Catat pelanggaran siswa sebagai draft, lalu konfirmasi untuk masuk perhitungan poin dan notifikasi portal."
      eyebrow="Discipline"
      fields={[
        { label: "Siswa", name: "studentId", type: "entity", entityType: "student", required: true },
        { label: "Aturan", name: "ruleId", type: "entity", entityType: "discipline-rule", required: true },
        { label: "Tanggal Kejadian", name: "incidentDate", required: true, type: "date" },
        { label: "Poin Override", name: "point", type: "number" },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={(api, query) => api.listDisciplineViolations(query)}
      rowActions={[
        {
          label: "Confirm",
          run: (api, row) => api.confirmDisciplineViolation(row.id as string),
          show: (row) => row.status === "DRAFT",
          variant: "primary",
        },
        {
          label: "Cancel",
          run: (api, row) => api.cancelDisciplineViolation(row.id as string),
          show: (row) => row.status !== "CANCELLED",
          variant: "outline",
        },
        {
          label: "Print",
          run: async (api, row) => {
            const blob = await api.downloadDisciplineViolationPdf(row.id as string);
            api.savePdfBlob(blob, `discipline-violation-${row.id}.pdf`);
          },
          variant: "soft",
        },
      ]}
      statusMap={statusMap(["DRAFT", "CONFIRMED", "CANCELLED"])}
      statusOptions={statusOptions}
      title="Pelanggaran"
      update={(api, id, input) => api.updateDisciplineViolation(id, input)}
    />
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
