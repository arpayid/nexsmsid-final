import { MasterDataPage } from "@/components/master-data-page";

export default function DepartmentsPage() {
  return (
    <MasterDataPage
      description="Kelola jurusan atau bidang keahlian."
      fields={[
        { name: "code", label: "Kode", required: true },
        { name: "name", label: "Nama", required: true },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="departments"
      title="Jurusan"
    />
  );
}
