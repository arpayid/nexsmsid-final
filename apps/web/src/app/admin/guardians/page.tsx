"use client";

import { useMemo } from "react";

import type { MasterDataRecord } from "@nexsmsid/api-client";

import { PeoplePage, type PeopleField } from "@/components/people-page";
import { createBrowserApiClient } from "@/lib/api-client";

const fields: PeopleField[] = [
  { name: "name", label: "Nama Lengkap", required: true, table: true },
  {
    label: "Hubungan",
    name: "relation",
    options: ["FATHER", "MOTHER", "GUARDIAN", "GRANDPARENT", "SIBLING", "OTHER"],
    required: true,
    table: true,
    type: "select",
  },
  { name: "phone", label: "Telepon", required: true, table: true, type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "occupation", label: "Pekerjaan", table: true },
  { name: "address", label: "Alamat", table: false },
];

export default function GuardiansPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const resource = useMemo(
    () => ({
      create: (input: Record<string, unknown>) => api.createGuardian(input),
      delete: (id: string) => api.deleteGuardian(id),
      get: (id: string) => api.getGuardian(id),
      list: async (options: { limit: number; page: number; search?: string; status?: string }) => {
        const response = await api.listGuardians(options);
        return {
          items: response.items as unknown as MasterDataRecord[],
          meta: response.meta,
        };
      },
      update: (id: string, input: Record<string, unknown>) => api.updateGuardian(id, input),
    }),
    [api],
  );

  const excel = {
    downloadTemplate: () => api.downloadGuardiansTemplate(),
    exportData: () => api.exportGuardians(),
    importData: (file: File) => api.importGuardians(file),
    saveBlob: (blob: Blob, filename: string) => api.saveExcelBlob(blob, filename),
    templateFilename: "guardians-template.xlsx",
    exportFilename: "guardians-export.xlsx",
  };

  return (
    <PeoplePage
      description="Kelola data wali/orang tua siswa untuk kebutuhan komunikasi dan persetujuan akademik."
      excel={excel}
      fields={fields}
      resource={resource}
      statusOptions={[]}
      title="Wali/Orang Tua"
    />
  );
}
