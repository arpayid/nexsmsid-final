"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function InventoryCategoriesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Inventaris", "Kategori"]}
      columns={[
        { key: "code", label: "Kode Kategori", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Kategori" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("inventory/categories", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("inventory/categories", id)}
      description="Kelola kategori barang atau aset sarana prasarana."
      eyebrow="Sarpras"
      fields={[
        { label: "Kode Kategori", name: "code", required: true },
        { label: "Nama Kategori", name: "name", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("inventory/categories", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Kategori Inventaris"
      update={(api, id, input) => api.masterDataUpdate("inventory/categories", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
