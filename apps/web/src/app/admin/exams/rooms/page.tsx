"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function ExamRoomsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Ujian / CBT", "Ruangan"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama" },
        { key: "capacity", label: "Kapasitas" },
        { key: "location", label: "Lokasi", render: (row) => String(row.location ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} />,
        },
      ]}
      create={(api, input) => api.createExamRoom(coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.deleteExamRoom(id)}
      description="Kelola ruangan ujian."
      eyebrow="Ujian / CBT"
      fields={[
        { label: "Kode", name: "code", placeholder: "R-001", required: true },
        { label: "Nama", name: "name", placeholder: "Ruang 1", required: true },
        { label: "Kapasitas", name: "capacity", placeholder: "30", required: true, type: "number" },
        { label: "Lokasi", name: "location", placeholder: "Gedung A Lt. 1" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.listExamRooms({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data, meta: res.meta };
      }}
      title="Ruangan Ujian"
      update={(api, id, input) => {
        const { code: _code, ...rest } = input;
        return api.updateExamRoom(id, coerceBooleanFields(rest, ["isActive"]));
      }}
    />
  );
}
