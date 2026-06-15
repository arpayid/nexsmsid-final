"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["SENT", "READ", "DELETED"];

export default function AdminMessagesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Komunikasi", "Pesan Internal"]}
      columns={[
        { key: "subject", label: "Subjek" },
        { key: "sender.name", label: "Pengirim" },
        { key: "recipient.name", label: "Penerima" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Dikirim", render: (row) => String(row.createdAt ?? "-").slice(0, 10) },
      ]}
      create={(api, input) => api.sendMessage(input)}
      delete={(api, id) => api.deleteMessage(id)}
      description="Kotak masuk pesan internal. Pilih penerima dari daftar pengguna."
      eyebrow="Komunikasi"
      fields={[
        { name: "recipientId", label: "Penerima", type: "entity", entityType: "user", required: true },
        { name: "subject", label: "Subjek", required: true },
        { name: "body", label: "Isi Pesan", type: "textarea", required: true },
      ]}
      load={(api, params) => api.inboxMessages(params)}
      rowActions={[
        {
          label: "Tandai Dibaca",
          run: (api, row) => api.markMessageRead(row.id as string),
          show: (row) => row.status !== "READ",
          variant: "soft",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Pesan Internal"
    />
  );
}
