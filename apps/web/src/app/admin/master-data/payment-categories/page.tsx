"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function PaymentCategoriesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Master Data", "Kategori Pembayaran"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        {
          key: "defaultAmount",
          label: "Nominal Default",
          render: (row) => `Rp ${Number(row.defaultAmount ?? 0).toLocaleString("id-ID")}`,
        },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("payment-categories", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("payment-categories", id)}
      description="Kelola kategori biaya awal tanpa transaksi keuangan."
      eyebrow="Data Master"
      fields={[
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Nominal Default", name: "defaultAmount", type: "number" },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("payment-categories", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Kategori Pembayaran"
      update={(api, id, input) => api.masterDataUpdate("payment-categories", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
