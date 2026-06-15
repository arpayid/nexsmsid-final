"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];

export default function InternshipsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "PKL", "Data PKL"]}
      columns={[
        { key: "title", label: "Judul" },
        { key: "student.name", label: "Siswa" },
        { key: "industryPartner.name", label: "Mitra" },
        { key: "startDate", label: "Mulai", render: (row) => String(row.startDate ?? "-").slice(0, 10) },
        { key: "endDate", label: "Selesai", render: (row) => String(row.endDate ?? "-").slice(0, 10) },
        { key: "status", label: "Status" },
        { key: "finalScore", label: "Nilai" },
      ]}
      create={(api, input) => api.createInternship(input)}
      delete={(api, id) => api.deleteInternship(id)}
      description="Kelola penempatan dan workflow PKL siswa."
      eyebrow="PKL"
      fields={[
        { name: "studentId", label: "Siswa", type: "entity", entityType: "student", required: true },
        { name: "industryPartnerId", label: "Mitra Industri", type: "entity", entityType: "industry-partner", required: true },
        { name: "supervisorTeacherId", label: "Guru Pembimbing", type: "entity", entityType: "teacher" },
        { name: "title", label: "Judul PKL", required: true },
        { name: "startDate", label: "Tanggal Mulai", type: "date", required: true },
        { name: "endDate", label: "Tanggal Selesai", type: "date", required: true },
        { name: "status", label: "Status", type: "select", options: options(statuses) },
        { name: "note", label: "Catatan", type: "textarea" },
      ]}
      load={(api, params) => api.listInternships(params)}
      rowActions={[
        { label: "Start", run: (api, row) => api.startInternship(row.id as string), show: (row) => row.status === "PLANNED" },
        { label: "Complete", run: (api, row) => api.completeInternship(row.id as string), show: (row) => row.status === "ONGOING" },
        {
          label: "Cancel",
          run: (api, row) => api.cancelInternship(row.id as string),
          show: (row) => row.status === "PLANNED" || row.status === "ONGOING",
          variant: "ghost",
        },
      ]}
      modalActions={[
        {
          label: "Score",
          show: (row) => row.status !== "CANCELLED",
          fields: [
            { name: "disciplineScore", label: "Disiplin", type: "number", required: true },
            { name: "skillScore", label: "Keterampilan", type: "number", required: true },
            { name: "attitudeScore", label: "Sikap", type: "number", required: true },
            { name: "reportScore", label: "Laporan", type: "number", required: true },
            { name: "note", label: "Catatan", type: "textarea" },
          ],
          submit: (api, row, payload) => api.scoreInternship(row.id as string, payload),
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Data PKL"
      update={(api, id, input) => api.updateInternship(id, input)}
    />
  );
}
