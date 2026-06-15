"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const memberTypes = ["STUDENT", "TEACHER", "STAFF", "PUBLIC"];
const statuses = ["ACTIVE", "EXPIRED", "SUSPENDED"];

export default function LibraryMembersPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Perpustakaan", "Anggota"]}
      columns={[
        { key: "memberCode", label: "Kode Anggota" },
        { key: "fullName", label: "Nama" },
        { key: "type", label: "Tipe" },
        { key: "status", label: "Status" },
        { key: "phone", label: "Telepon" },
      ]}
      description="Kelola data anggota perpustakaan."
      eyebrow="Perpustakaan"
      fields={[
        { name: "memberCode", label: "Kode Anggota", required: true },
        { name: "fullName", label: "Nama Lengkap", required: true },
        { name: "type", label: "Tipe Anggota", type: "select", options: options(memberTypes), required: true },
        { name: "status", label: "Status", type: "select", options: options(statuses) },
        { name: "phone", label: "Telepon" },
        { name: "email", label: "Email" },
        { name: "address", label: "Alamat", type: "textarea" },
      ]}
      load={async (api, params) => {
        const res = (await api.listLibraryMembers(params)) as { data?: Array<Record<string, unknown>>; meta?: { total: number } };
        return { items: res.data ?? [], meta: res.meta };
      }}
      title="Anggota Perpustakaan"
      create={(api, input) => api.createLibraryMember(input)}
      update={(api, id, input) => api.updateLibraryMember(id, input)}
      delete={(api, id) => api.deleteLibraryMember(id)}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
    />
  );
}
