"use client";

import { Badge } from "@nexsmsid/ui";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const activeOptions = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];

export default function LibraryShelvesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Perpustakaan", "Rak"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Rak", render: (row) => <span className="font-semibold">{String(row.name ?? "-")}</span> },
        { key: "location", label: "Lokasi", render: (row) => String(row.location ?? "-") },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
        {
          key: "isActive",
          label: "Status",
          render: (row) => (
            <Badge variant={row.isActive === false ? "secondary" : "success"}>{row.isActive === false ? "Nonaktif" : "Aktif"}</Badge>
          ),
        },
      ]}
      create={(api, input) => api.createLibraryShelf(coerceBooleanFields(input, ["isActive"]))}
      delete={(api, id) => api.deleteLibraryShelf(id)}
      description="Kelola rak penyimpanan buku perpustakaan."
      eyebrow="Perpustakaan"
      fields={[
        { label: "Kode Rak", name: "code", placeholder: "RK-01", required: true },
        { label: "Nama Rak", name: "name", placeholder: "Rak Fiksi", required: true },
        { label: "Lokasi", name: "location", placeholder: "Lantai 1" },
        { label: "Deskripsi", name: "description", type: "textarea" },
        { label: "Status", name: "isActive", options: activeOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.listLibraryShelves({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data ?? [], meta: res.meta };
      }}
      title="Rak Buku"
      update={(api, id, input) => api.updateLibraryShelf(id, coerceBooleanFields(input, ["isActive"]))}
    />
  );
}
