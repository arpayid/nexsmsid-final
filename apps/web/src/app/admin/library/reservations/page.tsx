"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["PENDING", "READY", "BORROWED", "CANCELLED", "EXPIRED"];

export default function LibraryReservationsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Perpustakaan", "Reservasi"]}
      columns={[
        {
          key: "member",
          label: "Anggota",
          render: (row) => {
            const member = row.member as Record<string, unknown> | undefined;
            const student = member?.student as Record<string, unknown> | undefined;
            return String(student?.name ?? member?.memberCode ?? "-");
          },
        },
        {
          key: "book",
          label: "Buku",
          render: (row) => String((row.book as Record<string, unknown> | undefined)?.title ?? "-"),
        },
        { key: "status", label: "Status" },
        {
          key: "requestedAt",
          label: "Tanggal Reservasi",
          render: (row) => (row.requestedAt ? new Date(String(row.requestedAt)).toLocaleDateString("id-ID") : "-"),
        },
      ]}
      create={(api, input) => api.createLibraryReservation(input)}
      description="Kelola reservasi buku oleh anggota."
      eyebrow="Perpustakaan"
      fields={[
        { name: "memberId", label: "Anggota", type: "entity", entityType: "library-member", required: true },
        { name: "bookId", label: "Buku", type: "entity", entityType: "library-book", required: true },
        { name: "note", label: "Catatan", type: "textarea" },
      ]}
      load={async (api, params) => {
        const res = (await api.listLibraryReservations(params)) as { data?: Array<Record<string, unknown>>; meta?: { total: number } };
        return { items: res.data ?? [], meta: res.meta };
      }}
      rowActions={[
        {
          label: "Siap",
          run: (api, row) => api.markLibraryReservationReady(row.id as string),
          show: (row) => row.status === "PENDING",
        },
        {
          label: "Batalkan",
          run: (api, row) => api.cancelLibraryReservation(row.id as string),
          show: (row) => ["PENDING", "READY"].includes(String(row.status)),
          variant: "ghost",
        },
        {
          label: "Kedaluwarsa",
          run: (api, row) => api.expireLibraryReservation(row.id as string),
          show: (row) => row.status === "READY",
          variant: "ghost",
        },
      ]}
      title="Reservasi Buku"
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
    />
  );
}
