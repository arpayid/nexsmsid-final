"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"];

export default function TracerStudiesPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BKK", "Tracer Study"]}
      columns={[
        { key: "alumni.name", label: "Alumni" },
        { key: "year", label: "Tahun" },
        { key: "status", label: "Status" },
        { key: "companyName", label: "Perusahaan" },
        { key: "university", label: "Kampus" },
        { key: "businessName", label: "Usaha" },
      ]}
      create={(api, input) => api.createTracerStudy(input)}
      delete={(api, id) => api.deleteTracerStudy(id)}
      description="Kelola pelacakan karier alumni."
      eyebrow="BKK"
      fields={[
        { name: "alumniId", label: "Alumni", type: "entity", entityType: "alumni", required: true },
        { name: "year", label: "Tahun", type: "number", required: true },
        { name: "status", label: "Status", type: "select", options: options(statuses), required: true },
        { name: "companyName", label: "Perusahaan" },
        { name: "position", label: "Posisi" },
        { name: "university", label: "Universitas" },
        { name: "major", label: "Jurusan Kuliah" },
        { name: "businessName", label: "Nama Usaha" },
        { name: "incomeRange", label: "Rentang Penghasilan" },
        { name: "feedback", label: "Feedback", type: "textarea" },
      ]}
      load={(api, params) => api.listTracerStudies(params)}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Tracer Study"
      update={(api, id, input) => api.updateTracerStudy(id, input)}
    />
  );
}
