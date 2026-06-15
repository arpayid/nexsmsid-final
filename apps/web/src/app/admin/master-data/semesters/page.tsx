import { MasterDataPage } from "@/components/master-data-page";

export default function SemestersPage() {
  return (
    <MasterDataPage
      description="Kelola semester yang terhubung ke tahun ajaran."
      fields={[
        { name: "academicYearId", label: "Tahun Ajaran", type: "entity", entityType: "academic-year", required: true, table: false },
        { name: "academicYear", label: "Tahun Ajaran", table: true },
        { name: "name", label: "Nama", required: true },
        { name: "order", label: "Urutan", required: true, type: "number" },
        { name: "startDate", label: "Tanggal Mulai", required: true, type: "date" },
        { name: "endDate", label: "Tanggal Selesai", required: true, type: "date" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="semesters"
      title="Semester"
    />
  );
}
