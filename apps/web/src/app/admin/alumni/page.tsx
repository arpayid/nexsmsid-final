"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"];

export default function AlumniPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BKK", "Alumni"]}
      columns={[
        { key: "name", label: "Nama" },
        { key: "nis", label: "NIS" },
        { key: "graduationYear", label: "Lulus" },
        { key: "status", label: "Status" },
        { key: "currentCompany", label: "Perusahaan" },
        { key: "university", label: "Kampus" },
      ]}
      create={(api, input) => api.createAlumni(input)}
      delete={(api, id) => api.deleteAlumni(id)}
      description="Kelola data alumni dan status karier."
      eyebrow="BKK"
      fields={[
        { name: "studentId", label: "Siswa", type: "entity", entityType: "student" },
        { name: "nis", label: "NIS" },
        { name: "name", label: "Nama", required: true },
        { name: "graduationYear", label: "Tahun Lulus", type: "number", required: true },
        { name: "phone", label: "Telepon" },
        { name: "email", label: "Email" },
        { name: "status", label: "Status", type: "select", options: options(statuses), required: true },
        { name: "currentCompany", label: "Perusahaan" },
        { name: "currentPosition", label: "Posisi" },
        { name: "university", label: "Universitas" },
        { name: "businessName", label: "Nama Usaha" },
        { name: "address", label: "Alamat", type: "textarea" },
      ]}
      load={(api, params) => api.listAlumni(params)}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Alumni"
      update={(api, id, input) => api.updateAlumni(id, input)}
    />
  );
}
