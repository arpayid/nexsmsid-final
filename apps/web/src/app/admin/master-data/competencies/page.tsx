import { MasterDataPage } from "@/components/master-data-page";

export default function CompetenciesPage() {
  return (
    <MasterDataPage
      description="Kelola program keahlian yang berada di bawah jurusan."
      fields={[
        { name: "departmentId", label: "Jurusan", type: "entity", entityType: "department", required: true, table: false },
        { name: "department", label: "Jurusan", table: true },
        { name: "code", label: "Kode", required: true },
        { name: "name", label: "Nama", required: true },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="competencies"
      title="Program Keahlian"
    />
  );
}
