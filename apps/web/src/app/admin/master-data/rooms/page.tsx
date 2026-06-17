"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function RoomsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Master Data", "Ruangan"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        { key: "type", label: "Tipe", render: (row) => String(row.type ?? "-") },
        { key: "capacity", label: "Kapasitas", render: (row) => String(row.capacity ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("rooms", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("rooms", id)}
      description="Kelola ruangan sekolah untuk fondasi jadwal dan inventaris."
      eyebrow="Data Master"
      fields={[
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Tipe", name: "type" },
        { label: "Kapasitas", name: "capacity", type: "number" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("rooms", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Ruangan"
      update={(api, id, input) => api.masterDataUpdate("rooms", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
