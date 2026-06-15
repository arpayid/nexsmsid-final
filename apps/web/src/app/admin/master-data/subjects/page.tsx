import { MasterDataPage } from "@/components/master-data-page";

export default function SubjectsPage() {
  return (
    <MasterDataPage
      description="Kelola mata pelajaran dasar."
      fields={[
        { name: "code", label: "Kode", required: true },
        { name: "name", label: "Nama", required: true },
        { name: "group", label: "Kelompok" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="subjects"
      title="Mata Pelajaran"
    />
  );
}
