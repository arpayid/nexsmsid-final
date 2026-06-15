import { MasterDataPage } from "@/components/master-data-page";

export default function InventoryCategoriesPage() {
  return (
    <MasterDataPage
      description="Kelola kategori barang atau aset sarana prasarana."
      fields={[
        { name: "code", label: "Kode Kategori", required: true },
        { name: "name", label: "Nama Kategori", required: true },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="inventory/categories"
      title="Kategori Inventaris"
    />
  );
}
