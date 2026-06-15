"use client";

import { Phase9ResourcePage, statusMap } from "@/components/phase9-resource-page";

export default function LetterApprovalsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Surat Menyurat", "Approval Surat"]}
      columns={[
        { key: "subject", label: "Perihal" },
        { key: "category", label: "Kategori" },
        { key: "priority", label: "Prioritas" },
        { key: "recipientName", label: "Penerima" },
        { key: "createdBy.name", label: "Dibuat Oleh" },
        { key: "submittedAt", label: "Submitted", render: (row) => formatDate(row.submittedAt) },
        { key: "status", label: "Status" },
      ]}
      description="Review surat yang sudah disubmit, lalu approve atau reject dengan alasan."
      eyebrow="Surat Menyurat"
      load={(api, query) => api.listLetters({ limit: query.limit, page: query.page, search: query.search, status: "SUBMITTED" })}
      rowActions={[
        { label: "Approve", run: (api, row) => api.approveLetter(row.id as string), variant: "primary" },
        {
          label: "Reject",
          run: async (api, row) => {
            const reason = window.prompt("Alasan penolakan surat?");
            if (!reason) return;
            await api.rejectLetter(row.id as string, { rejectionReason: reason });
          },
          variant: "outline",
        },
        {
          label: "PDF",
          run: async (api, row) => {
            const blob = await api.downloadLetterPdf(row.id as string);
            api.savePdfBlob(blob, `letter-${row.id}.pdf`);
          },
          variant: "soft",
        },
      ]}
      statusMap={statusMap(["SUBMITTED"])}
      title="Approval Surat"
    />
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
