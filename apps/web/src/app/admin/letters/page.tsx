"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ISSUED", "ARCHIVED", "CANCELLED"];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
const recipientTypes = ["STUDENT", "GUARDIAN", "TEACHER", "STAFF", "USER", "EXTERNAL"];

export default function LettersArchivePage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Surat Menyurat", "Arsip Surat"]}
      columns={[
        { key: "letterNumber", label: "Nomor", render: (row) => String(row.letterNumber ?? "-") },
        { key: "subject", label: "Perihal" },
        { key: "category", label: "Kategori" },
        { key: "direction", label: "Arah" },
        { key: "recipientName", label: "Penerima" },
        { key: "status", label: "Status" },
        { key: "issuedAt", label: "Terbit", render: (row) => formatDate(row.issuedAt) },
      ]}
      delete={(api, id) => api.deleteLetter(id)}
      description="Arsip surat sekolah dengan workflow draft, submitted, approved, issued, archived, dan cancelled."
      eyebrow="Surat Menyurat"
      fields={[
        { label: "Perihal", name: "subject" },
        { label: "Isi Surat", name: "body", type: "textarea" },
        { label: "Kategori", name: "category" },
        { label: "Prioritas", name: "priority", options: options(priorities), type: "select" },
        { label: "Tipe Penerima", name: "recipientType", options: options(recipientTypes), type: "select" },
        { label: "Nama Penerima", name: "recipientName" },
        { label: "Email Penerima", name: "recipientEmail" },
        { label: "Alamat Penerima", name: "recipientAddress", type: "textarea" },
      ]}
      load={(api, query) => api.listLetters({ limit: query.limit, page: query.page, search: query.search, status: query.status })}
      rowActions={[
        {
          label: "Submit",
          run: (api, row) => api.submitLetter(row.id as string),
          show: (row) => row.status === "DRAFT",
          variant: "primary",
        },
        {
          label: "Issue",
          run: (api, row) => api.issueLetter(row.id as string),
          show: (row) => row.status === "DRAFT" || row.status === "SUBMITTED" || row.status === "APPROVED",
          variant: "primary",
        },
        {
          label: "Archive",
          run: (api, row) => api.archiveLetter(row.id as string),
          show: (row) => row.status === "ISSUED",
          variant: "outline",
        },
        {
          label: "Cancel",
          run: (api, row) => api.cancelLetter(row.id as string),
          show: (row) => !["ARCHIVED", "CANCELLED"].includes(String(row.status)),
          variant: "outline",
        },
        {
          label: "Reopen",
          run: (api, row) => api.reopenLetter(row.id as string),
          show: (row) => row.status === "REJECTED",
          variant: "soft",
        },
        {
          label: "PDF",
          run: async (api, row) => {
            const blob = await api.downloadLetterPdf(row.id as string);
            api.savePdfBlob(blob, `letter-${row.letterNumber ?? row.id}.pdf`);
          },
          variant: "soft",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Arsip Surat"
      update={(api, id, input) => api.updateLetter(id, input)}
    />
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
