import { MasterDataPage } from "@/components/master-data-page";

export default function AcademicYearsPage() {
  return (
    <MasterDataPage
      description="Kelola tahun ajaran sebagai fondasi kalender akademik."
      fields={[
        { name: "name", label: "Nama", required: true },
        { name: "startDate", label: "Tanggal Mulai", required: true, type: "date" },
        { name: "endDate", label: "Tanggal Selesai", required: true, type: "date" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="academic-years"
      title="Tahun Ajaran"
    />
  );
}
