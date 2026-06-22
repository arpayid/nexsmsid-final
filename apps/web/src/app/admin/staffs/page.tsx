"use client";

import { useMemo, useState } from "react";

import type { MasterDataRecord } from "@nexsmsid/api-client";
import { Button, ConfirmDialog } from "@nexsmsid/ui";

import { PeoplePage, type PeopleField } from "@/components/people-page";
import { createBrowserApiClient } from "@/lib/api-client";

const fields: PeopleField[] = [
  { name: "nip", label: "NIP", table: true },
  { name: "name", label: "Nama Lengkap", required: true, table: true },
  {
    label: "Jenis Kelamin",
    name: "gender",
    options: ["MALE", "FEMALE"],
    required: true,
    table: true,
    type: "select",
  },
  { name: "phone", label: "Telepon", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "address", label: "Alamat", table: false },
  { name: "position", label: "Jabatan", required: true, table: true },
  { name: "department", label: "Unit/Departemen", table: true },
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

export default function StaffsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function handleResetPassword(item: MasterDataRecord) {
    setResetBusyId(item.id);
    try {
      await api.resetUserPassword(item.id, {});
      setTempPassword("Password telah direset. Beri tahu staff untuk menggunakan password baru.");
    } catch {
      setTempPassword("Gagal mereset password");
    } finally {
      setResetBusyId(null);
    }
  }

  const resource = useMemo(
    () => ({
      create: (input: Record<string, unknown>) => api.createStaff(input),
      delete: (id: string) => api.deleteStaff(id),
      get: (id: string) => api.getStaff(id),
      list: async (options: { limit: number; page: number; search?: string; status?: string }) => {
        const response = await api.listStaffs(options);
        return {
          items: response.items as unknown as MasterDataRecord[],
          meta: response.meta,
        };
      },
      update: (id: string, input: Record<string, unknown>) => api.updateStaff(id, input),
    }),
    [api],
  );

  const excel = {
    downloadTemplate: () => api.downloadStaffsTemplate(),
    exportData: () => api.exportStaffs(),
    importData: (file: File) => api.importStaffs(file),
    saveBlob: (blob: Blob, filename: string) => api.saveExcelBlob(blob, filename),
    templateFilename: "staffs-template.xlsx",
    exportFilename: "staffs-export.xlsx",
  };

  return (
    <>
      <PeoplePage
        description="Kelola data staff tata usaha dan tenaga kependidikan non-guru."
        eyebrow="People & Akademik"
        excel={excel}
        extraRowActions={(item) => (
          <Button disabled={resetBusyId === item.id} onClick={() => void handleResetPassword(item)} size="sm" variant="outline">
            Reset PW
          </Button>
        )}
        fields={fields}
        resource={resource}
        statusOptions={["ACTIVE", "INACTIVE", "RESIGNED", "TRANSFERRED"]}
        title="Staff"
      />

      <ConfirmDialog
        cancelLabel="Tutup"
        confirmLabel="OK"
        description={<span className="text-sm">{tempPassword}</span>}
        onCancel={() => setTempPassword(null)}
        onConfirm={() => setTempPassword(null)}
        open={Boolean(tempPassword)}
        title="Password Staff Direset"
      />
    </>
  );
}
