"use client";

import { Phase9ResourcePage } from "@/components/phase9-resource-page";

export default function ExamBanksPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "Ujian / CBT", "Bank Soal"]}
      columns={[
        { key: "name", label: "Nama" },
        { key: "description", label: "Deskripsi", render: (row) => String(row.description ?? "-") },
      ]}
      create={(api, input) => api.createExamBank(input)}
      description="Kelola bank soal."
      eyebrow="Ujian / CBT"
      fields={[
        { label: "Nama Bank Soal", name: "name", placeholder: "Bank Soal Matematika", required: true },
        { label: "Deskripsi", name: "description", type: "textarea" },
      ]}
      load={async (api, query) => {
        const res = await api.listExamBanks({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data ?? [], meta: res.meta };
      }}
      title="Bank Soal"
    />
  );
}
