"use client";

import { StatusBadge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function LessonHoursPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Master Data", "Jam Pelajaran"]}
      columns={[
        { key: "name", label: "Nama" },
        { key: "order", label: "Urutan" },
        { key: "startTime", label: "Mulai" },
        { key: "endTime", label: "Selesai" },
        {
          key: "isActive",
          label: "Status",
          render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} />,
        },
      ]}
      create={(api, input) => api.masterDataCreate("lesson-hours", coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.masterDataDelete("lesson-hours", id)}
      description="Kelola jam pelajaran dasar untuk fondasi jadwal."
      eyebrow="Data Master"
      fields={[
        { label: "Nama", name: "name", required: true },
        { label: "Urutan", name: "order", required: true, type: "number" },
        { label: "Jam Mulai", name: "startTime", required: true, type: "text", placeholder: "07:00" },
        { label: "Jam Selesai", name: "endTime", required: true, type: "text", placeholder: "07:45" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.masterDataList("lesson-hours", { limit: query.limit, page: query.page, search: query.search });
        const items = res.data ?? [];
        return { items, meta: { total: items.length } };
      }}
      title="Jam Pelajaran"
      update={(api, id, input) => api.masterDataUpdate("lesson-hours", id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
