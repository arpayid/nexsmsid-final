"use client";

import { useMemo } from "react";

import type { MasterDataRecord } from "@nexsmsid/api-client";

import { PeoplePage, type PeopleField } from "@/components/people-page";
import { createBrowserApiClient } from "@/lib/api-client";

const fields: PeopleField[] = [
  { name: "nip", label: "NIP", table: true },
  { name: "nuptk", label: "NUPTK" },
  { name: "name", label: "Nama Lengkap", required: true, table: true },
  {
    label: "Jenis Kelamin",
    name: "gender",
    options: ["MALE", "FEMALE"],
    required: true,
    table: true,
    type: "select",
  },
  { name: "birthPlace", label: "Tempat Lahir" },
  { name: "birthDate", label: "Tanggal Lahir", type: "date", table: false },
  { name: "phone", label: "Telepon", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "address", label: "Alamat", table: false },
  {
    label: "Status Kepegawaian",
    name: "employmentStatus",
    options: ["PERMANENT", "CONTRACT", "HONORARY", "PROBATION"],
    required: true,
    table: true,
    type: "select",
  },
  {
    label: "Status",
    name: "status",
    options: ["ACTIVE", "INACTIVE", "RESIGNED", "TRANSFERRED"],
    required: true,
    table: true,
    type: "select",
  },
  { name: "photoUrl", label: "Photo URL", type: "url", table: false },
];

export default function TeachersPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const resource = useMemo(
    () => ({
      create: (input: Record<string, unknown>) => api.createTeacher(input),
      delete: (id: string) => api.deleteTeacher(id),
      get: (id: string) => api.getTeacher(id),
      list: async (options: { limit: number; page: number; search?: string; status?: string }) => {
        const response = await api.listTeachers(options);
        return {
          items: response.items as unknown as MasterDataRecord[],
          meta: response.meta,
        };
      },
      update: (id: string, input: Record<string, unknown>) => api.updateTeacher(id, input),
    }),
    [api],
  );

  const excel = {
    downloadTemplate: () => api.downloadTeachersTemplate(),
    exportData: () => api.exportTeachers(),
    importData: (file: File) => api.importTeachers(file),
    saveBlob: (blob: Blob, filename: string) => api.saveExcelBlob(blob, filename),
    templateFilename: "teachers-template.xlsx",
    exportFilename: "teachers-export.xlsx",
  };

  return (
    <PeoplePage
      description="Kelola data guru dan tenaga pendidik untuk kebutuhan penjadwalan serta pembelajaran."
      excel={excel}
      fields={fields}
      resource={resource}
      statusOptions={["ACTIVE", "INACTIVE", "RESIGNED", "TRANSFERRED"]}
      title="Guru"
    />
  );
}
