import { MasterDataPage } from "@/components/master-data-page";

export default function RoomsPage() {
  return (
    <MasterDataPage
      description="Kelola ruangan sekolah untuk fondasi jadwal dan inventaris."
      fields={[
        { name: "code", label: "Kode", required: true },
        { name: "name", label: "Nama", required: true },
        { name: "type", label: "Tipe" },
        { name: "capacity", label: "Kapasitas", type: "number" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="rooms"
      title="Ruangan"
    />
  );
}
