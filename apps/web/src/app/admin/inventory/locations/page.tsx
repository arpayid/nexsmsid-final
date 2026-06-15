import { MasterDataPage } from "@/components/master-data-page";

export default function InventoryLocationsPage() {
  return (
    <MasterDataPage
      description="Kelola lokasi penyimpanan atau penempatan barang inventaris."
      fields={[
        { name: "code", label: "Kode Lokasi", required: true },
        { name: "name", label: "Nama Lokasi", required: true },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "roomId", label: "Ruangan", type: "entity", entityType: "room" },
        { name: "responsibleUserId", label: "Penanggung Jawab", type: "entity", entityType: "user" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="inventory/locations"
      title="Lokasi Inventaris"
    />
  );
}
