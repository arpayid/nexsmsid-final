"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const audiences = ["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"];

export default function AdminAnnouncementsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Komunikasi", "Pengumuman"]}
      columns={[
        { key: "title", label: "Judul" },
        { key: "audience", label: "Audiens" },
        { key: "status", label: "Status" },
        { key: "publishedAt", label: "Publikasi", render: (row) => String(row.publishedAt ?? "-").slice(0, 10) },
      ]}
      create={(api, input) => api.createAnnouncement(input)}
      delete={(api, id) => api.deleteAnnouncement(id)}
      description="Kelola pengumuman sekolah dan publikasi portal publik."
      eyebrow="Komunikasi"
      fields={[
        { name: "title", label: "Judul", required: true },
        { name: "audience", label: "Audiens", type: "select", options: options(audiences), required: true },
        { name: "status", label: "Status", type: "select", options: options(statuses), required: true },
        { name: "content", label: "Konten", type: "textarea", required: true },
      ]}
      load={(api, params) => api.listAnnouncements(params)}
      rowActions={[
        {
          label: "Publish",
          run: (api, row) => api.publishAnnouncement(row.id as string),
          show: (row) => row.status !== "PUBLISHED",
          variant: "soft",
        },
        {
          label: "Archive",
          run: (api, row) => api.archiveAnnouncement(row.id as string),
          show: (row) => row.status !== "ARCHIVED",
          variant: "outline",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Pengumuman"
      update={(api, id, input) => api.updateAnnouncement(id, input)}
    />
  );
}
