"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";

const statuses = ["ACTIVE", "INACTIVE"];

export default function IndustryPartnersPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "PKL", "Mitra Industri"]}
      columns={[
        { key: "name", label: "Nama" },
        { key: "type", label: "Tipe" },
        { key: "contactPerson", label: "Kontak" },
        { key: "phone", label: "Telepon" },
        { key: "status", label: "Status" },
      ]}
      create={(api, input) => api.createIndustryPartner(input)}
      delete={(api, id) => api.deleteIndustryPartner(id)}
      description="Kelola mitra industri untuk PKL dan BKK."
      eyebrow="PKL"
      fields={[
        { name: "name", label: "Nama Mitra", required: true },
        { name: "type", label: "Tipe" },
        { name: "contactPerson", label: "Contact Person" },
        { name: "phone", label: "Telepon" },
        { name: "email", label: "Email" },
        { name: "website", label: "Website" },
        { name: "status", label: "Status", type: "select", options: options(statuses), required: true },
        { name: "address", label: "Alamat", type: "textarea" },
        { name: "note", label: "Catatan", type: "textarea" },
      ]}
      load={(api, params) => api.listIndustryPartners(params)}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Mitra Industri"
      update={(api, id, input) => api.updateIndustryPartner(id, input)}
    />
  );
}
