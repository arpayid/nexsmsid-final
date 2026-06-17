"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function ExamTypesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Ujian / CBT", "Tipe Ujian"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} />,
        },
      ]}
      create={(api, input) => api.createExamType(coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.deleteExamType(id)}
      description="Kelola tipe-tipe ujian."
      eyebrow="Ujian / CBT"
      fields={[
        { label: "Kode", name: "code", placeholder: "UTS", required: true },
        { label: "Nama", name: "name", placeholder: "Ujian Tengah Semester", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.listExamTypes({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data, meta: res.meta };
      }}
      title="Tipe Ujian"
      update={(api, id, input) => {
        const { code: _code, ...rest } = input;
        return api.updateExamType(id, coerceBooleanFields(rest, ["isActive"]));
      }}
    />
  );
}
