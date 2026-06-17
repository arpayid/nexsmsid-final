"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function InventoryLocationsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Inventaris", "Lokasi"]}
      columns={[
        { key: "code", label: "Kode Lokasi", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Lokasi" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("inventory/locations", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("inventory/locations", id)}
      description="Kelola lokasi penyimpanan atau penempatan barang inventaris."
      eyebrow="Sarpras"
      fields={[
        { label: "Kode Lokasi", name: "code", required: true },
        { label: "Nama Lokasi", name: "name", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Ruangan", name: "roomId", type: "entity", entityType: "room" },
        { label: "Penanggung Jawab", name: "responsibleUserId", type: "entity", entityType: "user" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("inventory/locations", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Lokasi Inventaris"
      update={(api, id, input) => api.masterDataUpdate("inventory/locations", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
