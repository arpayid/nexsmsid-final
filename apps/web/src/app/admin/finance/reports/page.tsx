"use client";

import { ModuleReportHub } from "@/components/module-report-hub";

export default function FinanceReportsPage() {
  return (
    <ModuleReportHub
      breadcrumb={["Admin", "Keuangan", "Laporan"]}
      description="Rekap tagihan, pembayaran, pengeluaran, dan arus kas sekolah."
      eyebrow="Keuangan"
      reports={[
        { code: "invoice-recap", label: "Rekap Tagihan", description: "Ringkasan tagihan siswa per periode." },
        { code: "payment-recap", label: "Rekap Pembayaran", description: "Pembayaran yang diterima sekolah." },
        { code: "outstanding-invoices", label: "Tagihan Belum Lunas", description: "Daftar tunggakan pembayaran." },
        { code: "expense-recap", label: "Rekap Pengeluaran", description: "Pengeluaran operasional sekolah." },
        { code: "cashflow-recap", label: "Arus Kas", description: "Ringkasan pemasukan dan pengeluaran.", format: "PDF" },
      ]}
      title="Laporan Keuangan"
    />
  );
}
