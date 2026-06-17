"use client";

import { Phase9ResourcePage } from "@/components/phase9-resource-page";

export default function LibraryCategoriesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Perpustakaan", "Kategori"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Kategori", render: (row) => <span className="font-semibold">{String(row.name ?? "-")}</span> },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
      ]}
      create={(api, input) => api.createLibraryCategory(input)}
      delete={(api, id) => api.deleteLibraryCategory(id)}
      description="Kelola kategori klasifikasi buku perpustakaan."
      eyebrow="Perpustakaan"
      fields={[
        { label: "Kode Kategori", name: "code", placeholder: "CT-01", required: true },
        { label: "Nama Kategori", name: "name", placeholder: "Fiksi, Sains, dll.", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={async (api, query) => {
        const res = await api.listLibraryCategories({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data ?? [], meta: res.meta };
      }}
      title="Kategori Buku"
      update={(api, id, input) => api.updateLibraryCategory(id, input)}
    />
  );
}
