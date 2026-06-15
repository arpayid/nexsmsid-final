import { MasterDataPage } from "@/components/master-data-page";

export default function LessonHoursPage() {
  return (
    <MasterDataPage
      description="Kelola jam pelajaran dasar untuk fondasi jadwal."
      fields={[
        { name: "name", label: "Nama", required: true },
        { name: "order", label: "Urutan", required: true, type: "number" },
        { name: "startTime", label: "Jam Mulai", required: true, type: "time" },
        { name: "endTime", label: "Jam Selesai", required: true, type: "time" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="lesson-hours"
      title="Jam Pelajaran"
    />
  );
}
