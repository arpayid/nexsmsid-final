"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function DepartmentsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Master Data", "Jurusan"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("departments", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("departments", id)}
      description="Kelola jurusan atau bidang keahlian."
      eyebrow="Data Master"
      fields={[
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("departments", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Jurusan"
      update={(api, id, input) => api.masterDataUpdate("departments", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
