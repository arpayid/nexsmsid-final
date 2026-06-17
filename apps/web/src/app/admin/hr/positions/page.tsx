"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function HRPositionsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "HR & Payroll", "Jabatan"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Jabatan" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} />,
        },
      ]}
      create={(api, input) => api.createHRPosition(coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.deleteHRPosition(id)}
      description="Kelola posisi dan jabatan pegawai."
      eyebrow="HR & Payroll"
      fields={[
        { label: "Kode Jabatan", name: "code", placeholder: "TCHR", required: true },
        { label: "Nama Jabatan", name: "name", placeholder: "Guru Mapel", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.listHRPositions({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data, meta: res.meta };
      }}
      title="Jabatan HR"
      update={(api, id, input) => api.updateHRPosition(id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
