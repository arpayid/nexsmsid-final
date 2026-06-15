import { MasterDataPage } from "@/components/master-data-page";

export default function PaymentCategoriesPage() {
  return (
    <MasterDataPage
      description="Kelola kategori biaya awal tanpa transaksi keuangan."
      fields={[
        { name: "code", label: "Kode", required: true },
        { name: "name", label: "Nama", required: true },
        { name: "defaultAmount", label: "Nominal Default", type: "number" },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "isActive", label: "Aktif", type: "checkbox" },
      ]}
      resource="payment-categories"
      title="Kategori Pembayaran"
    />
  );
}
