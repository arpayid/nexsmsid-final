"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import type { ClassroomReference, MasterDataRecord, PortalAccountCredentials } from "@nexsmsid/api-client";
import { Button, ConfirmDialog, ErrorState, SectionCard } from "@nexsmsid/ui";

import { PeoplePage, type PeopleField } from "@/components/people-page";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const fields: PeopleField[] = [
  { name: "nis", label: "NIS", required: true, table: true },
  { name: "nisn", label: "NISN", table: true },
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
  { name: "birthDate", label: "Tanggal Lahir", type: "date" },
  { name: "address", label: "Alamat" },
  { name: "phone", label: "Telepon", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  {
    entityType: "classroom",
    label: "Kelas",
    name: "classroomId",
    placeholder: "Cari kelas...",
    table: false,
    type: "entity",
  },
  {
    label: "Status",
    name: "status",
    options: ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"],
    required: true,
    table: true,
    type: "select",
  },
  { name: "photoUrl", label: "Photo URL", type: "url", table: false },
  { name: "enrolledAt", label: "Tanggal Masuk", type: "date", table: false },
];

export default function StudentsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadClassrooms = useCallback(async () => {
    const response = await api.masterDataList("classrooms", { limit: 100 });
    return (response.data as unknown as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id),
      code: String(item.code ?? ""),
      name: String(item.name ?? ""),
      level: Number(item.level ?? 0),
    }));
  }, [api]);
  const {
    data: classroomsData,
    error: classroomError,
    refetch: reloadClassrooms,
  } = useApiQuery<ClassroomReference[]>(loadClassrooms, [api]);
  const classrooms = classroomsData ?? [];
  const [portalCredentials, setPortalCredentials] = useState<PortalAccountCredentials | null>(null);
  const [portalActionError, setPortalActionError] = useState<string | null>(null);
  const [portalBusyId, setPortalBusyId] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const resource = useMemo(
    () => ({
      create: (input: Record<string, unknown>) => api.createStudent(input),
      delete: (id: string) => api.deleteStudent(id),
      get: (id: string) => api.getStudent(id),
      list: async (options: { limit: number; page: number; search?: string; status?: string }) => {
        void listVersion;
        const response = await api.listStudents(options);
        return {
          items: response.items as unknown as MasterDataRecord[],
          meta: response.meta,
        };
      },
      update: (id: string, input: Record<string, unknown>) => api.updateStudent(id, input),
    }),
    [api, listVersion],
  );

  async function handleProvisionPortal(item: MasterDataRecord) {
    setPortalActionError(null);
    setPortalBusyId(item.id);
    try {
      const email = typeof item.email === "string" ? item.email : undefined;
      const credentials = await api.provisionStudentPortal(item.id, { email });
      setPortalCredentials(credentials);
      setListVersion((value) => value + 1);
    } catch (error) {
      setPortalActionError(error instanceof Error ? error.message : "Gagal membuat akun portal");
    } finally {
      setPortalBusyId(null);
    }
  }

  async function handleResetPortalPassword(item: MasterDataRecord) {
    setPortalActionError(null);
    setPortalBusyId(item.id);
    try {
      const credentials = await api.resetStudentPortalPassword(item.id);
      setPortalCredentials(credentials);
    } catch (error) {
      setPortalActionError(error instanceof Error ? error.message : "Gagal reset password portal");
    } finally {
      setPortalBusyId(null);
    }
  }

  const excel = useMemo(
    () => ({
      downloadTemplate: () => api.downloadStudentsTemplate(),
      exportData: () => api.exportStudents(),
      importData: (file: File) => api.importStudents(file),
      saveBlob: (blob: Blob, filename: string) => api.saveExcelBlob(blob, filename),
      templateFilename: "students-template.xlsx",
      exportFilename: "students-export.xlsx",
    }),
    [api],
  );

  return (
    <div className="space-y-6">
      {classroomError ? (
        <ErrorState message={classroomError} onRetry={() => void reloadClassrooms()} title="Gagal memuat referensi kelas" />
      ) : null}

      <ClassroomSummary classrooms={classrooms} />

      {portalActionError ? <ErrorState message={portalActionError} title="Aksi portal siswa gagal" /> : null}

      <PeoplePage
        description="Kelola data siswa, wali kelas, dan histori akademik dasar."
        eyebrow="People & Akademik"
        excel={excel}
        extraRowActions={(item) => (
          <>
            <Button asChild size="sm" variant="soft">
              <Link href={`/admin/students/${item.id}/guardians`}>Wali</Link>
            </Button>
            {!item.userId ? (
              <Button disabled={portalBusyId === item.id} onClick={() => void handleProvisionPortal(item)} size="sm" variant="outline">
                Portal
              </Button>
            ) : (
              <Button disabled={portalBusyId === item.id} onClick={() => void handleResetPortalPassword(item)} size="sm" variant="outline">
                Reset PW
              </Button>
            )}
          </>
        )}
        fields={fields}
        resource={resource}
        statusOptions={["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]}
        title="Siswa"
      />

      <ConfirmDialog
        cancelLabel="Tutup"
        confirmLabel="Salin kredensial"
        description={
          portalCredentials ? (
            <span className="block space-y-3 text-left text-sm">
              <span className="block text-muted-foreground">Kredensial hanya ditampilkan sekali.</span>
              <span className="block">
                Email: <strong className="font-mono">{portalCredentials.email}</strong>
              </span>
              <span className="block">
                Password: <strong className="font-mono">{portalCredentials.temporaryPassword}</strong>
              </span>
            </span>
          ) : null
        }
        onCancel={() => setPortalCredentials(null)}
        onConfirm={() => {
          if (portalCredentials) {
            void navigator.clipboard.writeText(`Email: ${portalCredentials.email}\nPassword: ${portalCredentials.temporaryPassword}`);
          }
          setPortalCredentials(null);
        }}
        open={Boolean(portalCredentials)}
        title="Kredensial portal siswa"
      />
    </div>
  );
}

function ClassroomSummary({ classrooms }: { classrooms: ClassroomReference[] }) {
  if (classrooms.length === 0) {
    return (
      <SectionCard
        description="Tambahkan kelas terlebih dahulu di menu Master Data Kelas agar siswa dapat ditempatkan."
        title="Belum ada kelas"
      >
        <span className="sr-only">Tidak ada kelas</span>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      description={`${classrooms.length} kelas aktif. Gunakan pencarian di form siswa untuk memilih kelas.`}
      title="Referensi Kelas"
    >
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {classrooms.slice(0, 6).map((classroom) => (
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs" key={classroom.id}>
            <p className="font-semibold uppercase tracking-widest text-primary">
              Tingkat {classroom.level} • {classroom.code}
            </p>
            <p className="text-sm font-bold text-foreground">{classroom.name}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
