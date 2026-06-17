"use client";

import { Phase9ResourcePage, coerceBooleanFields } from "@/components/phase9-resource-page";

const typeOptions = [
  { label: "Penerimaan (Earning)", value: "EARNING" },
  { label: "Potongan (Deduction)", value: "DEDUCTION" },
];

const calculationOptions = [
  { label: "Tetap (Fixed)", value: "FIXED" },
  { label: "Persentase", value: "PERCENTAGE" },
  { label: "Rumus (Formula)", value: "FORMULA" },
];

const yesNoOptions = [
  { label: "Ya", value: "true" },
  { label: "Tidak", value: "false" },
];

export default function PayrollComponentsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "HR & Payroll", "Komponen Gaji"]}
      columns={[
        { key: "code", label: "Kode", render: (row) => <span className="font-mono font-bold">{String(row.code ?? "-")}</span> },
        { key: "name", label: "Nama Komponen" },
        { key: "type", label: "Tipe" },
        { key: "calculationType", label: "Hitung" },
        {
          key: "defaultAmount",
          label: "Nominal",
          render: (row) => `Rp ${Number(row.defaultAmount ?? 0).toLocaleString("id-ID")}`,
        },
      ]}
      create={(api, input) => api.createPayrollComponent(coerceBooleanFields(input, ["isTaxable", "isActive"]))}
      delete={(api, id) => api.deletePayrollComponent(id)}
      description="Manajemen komponen gaji pegawai."
      eyebrow="Payroll"
      fields={[
        { label: "Kode", name: "code", placeholder: "GAPOK", required: true },
        { label: "Nama Komponen", name: "name", placeholder: "Gaji Pokok", required: true },
        { label: "Tipe", name: "type", options: typeOptions, required: true, type: "select" },
        { label: "Jenis Perhitungan", name: "calculationType", options: calculationOptions, required: true, type: "select" },
        { label: "Nominal Default", name: "defaultAmount", placeholder: "0", type: "number" },
        { label: "Kena Pajak", name: "isTaxable", options: yesNoOptions, type: "select" },
        { label: "Status", name: "isActive", options: yesNoOptions, type: "select" },
      ]}
      load={async (api, query) => {
        const res = await api.listPayrollComponents({ limit: query.limit, page: query.page, search: query.search });
        return { items: res.data, meta: res.meta };
      }}
      title="Komponen Gaji"
      update={(api, id, input) => api.updatePayrollComponent(id, coerceBooleanFields(input, ["isTaxable", "isActive"]))}
    />
  );
}
