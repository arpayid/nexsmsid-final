"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"];

export default function BkkJobsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BKK", "Lowongan Kerja"]}
      columns={[
        { key: "title", label: "Lowongan" },
        { key: "companyName", label: "Perusahaan" },
        { key: "location", label: "Lokasi" },
        { key: "employmentType", label: "Tipe" },
        { key: "deadline", label: "Deadline", render: (row) => String(row.deadline ?? "-").slice(0, 10) },
        { key: "status", label: "Status" },
      ]}
      create={(api, input) => api.createJobVacancy(input)}
      delete={(api, id) => api.deleteJobVacancy(id)}
      description="Kelola lowongan kerja BKK dan publikasi ke halaman jobs."
      eyebrow="BKK"
      fields={[
        { name: "industryPartnerId", label: "Mitra Industri", type: "entity", entityType: "industry-partner" },
        { name: "title", label: "Judul", required: true },
        { name: "companyName", label: "Perusahaan", required: true },
        { name: "location", label: "Lokasi" },
        { name: "employmentType", label: "Tipe Pekerjaan" },
        { name: "salaryRange", label: "Kisaran Gaji" },
        { name: "deadline", label: "Deadline", type: "date" },
        { name: "status", label: "Status", type: "select", options: options(statuses) },
        { name: "qualification", label: "Kualifikasi", type: "textarea" },
        { name: "description", label: "Deskripsi", type: "textarea", required: true },
      ]}
      load={(api, params) => api.listJobVacancies(params)}
      rowActions={[
        { label: "Publish", run: (api, row) => api.publishJobVacancy(row.id as string), show: (row) => row.status === "DRAFT" },
        {
          label: "Close",
          run: (api, row) => api.closeJobVacancy(row.id as string),
          show: (row) => row.status === "PUBLISHED",
          variant: "outline",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Lowongan Kerja"
      update={(api, id, input) => api.updateJobVacancy(id, input)}
    />
  );
}
