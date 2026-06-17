"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function CompetenciesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Master Data", "Program Keahlian"]}
      columns={[
        {
          key: "department",
          label: "Jurusan",
          render: (row) => String((row.department as Record<string, unknown> | undefined)?.name ?? "-"),
        },
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("competencies", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("competencies", id)}
      description="Kelola program keahlian yang berada di bawah jurusan."
      eyebrow="Data Master"
      fields={[
        { label: "Jurusan", name: "departmentId", type: "entity", entityType: "department", required: true },
        { label: "Kode", name: "code", required: true },
        { label: "Nama", name: "name", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("competencies", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Program Keahlian"
      update={(api, id, input) => api.masterDataUpdate("competencies", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
