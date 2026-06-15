"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const templateStatuses = ["ACTIVE", "INACTIVE"];

export default function LetterTemplatesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Surat Menyurat", "Template"]}
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "category", label: "Kategori" },
        { key: "requiresApproval", label: "Approval", render: (row) => (row.requiresApproval ? "Ya" : "Tidak") },
        { key: "status", label: "Status" },
      ]}
      create={(api, input) => api.createLetterTemplate(input)}
      delete={(api, id) => api.deleteLetterTemplate(id)}
      description="Kelola template surat, kode kategori, body template, dan kebutuhan approval."
      eyebrow="Surat Menyurat"
      fields={[
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Kategori", name: "category", required: true },
        { label: "Status", name: "status", options: options(templateStatuses), type: "select" },
        {
          label: "Butuh Approval",
          name: "requiresApproval",
          options: [
            { label: "Ya", value: "true" },
            { label: "Tidak", value: "false" },
          ],
          type: "select",
        },
        { label: "Subject Template", name: "subjectTemplate", required: true, type: "textarea" },
        { label: "Body Template", name: "bodyTemplate", required: true, type: "textarea" },
        { label: "Variables JSON/Simple Text", name: "variables", type: "textarea" },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={(api, query) => api.listLetterTemplates({ limit: query.limit, page: query.page, search: query.search, status: query.status })}
      statusMap={statusMap(templateStatuses)}
      statusOptions={options(templateStatuses)}
      title="Template Surat"
      update={(api, id, input) => api.updateLetterTemplate(id, input)}
    />
  );
}
