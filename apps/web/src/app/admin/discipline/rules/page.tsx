"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const severityOptions = options(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export default function DisciplineRulesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BK & Kedisiplinan", "Aturan"]}
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "point", label: "Poin" },
        { key: "severity", label: "Severity" },
        { key: "isActive", label: "Aktif", render: (row) => (row.isActive ? "Ya" : "Tidak") },
      ]}
      create={(api, input) => api.createDisciplineRule(input)}
      delete={(api, id) => api.deleteDisciplineRule(id)}
      description="Kelola kode pelanggaran, severity, dan poin kedisiplinan. Rule yang sudah terpakai akan dinonaktifkan saat dihapus."
      eyebrow="Discipline"
      fields={[
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Poin", name: "point", required: true, type: "number" },
        { label: "Severity", name: "severity", options: severityOptions, required: true, type: "select" },
        {
          label: "Aktif",
          name: "isActive",
          options: [
            { label: "Ya", value: "true" },
            { label: "Tidak", value: "false" },
          ],
          type: "select",
        },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={(api, query) => api.listDisciplineRules({ limit: query.limit, page: query.page, search: query.search, severity: query.status })}
      statusMap={statusMap(["LOW", "MEDIUM", "HIGH", "CRITICAL"])}
      statusOptions={severityOptions}
      title="Aturan Kedisiplinan"
      update={(api, id, input) => api.updateDisciplineRule(id, input)}
    />
  );
}
