"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { ClassroomReference, MasterDataRecord } from "@nexsmsid/api-client";
import { Button, ErrorState, SectionCard } from "@nexsmsid/ui";

import { PeoplePage, type PeopleField } from "@/components/people-page";
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
  const [classrooms, setClassrooms] = useState<ClassroomReference[]>([]);
  const [classroomError, setClassroomError] = useState<string | null>(null);

  const loadClassrooms = useCallback(async () => {
    setClassroomError(null);
    try {
      const response = await api.masterDataList("classrooms", { limit: 100 });
      const items = (response.data as unknown as Array<Record<string, unknown>>).map((item) => ({
        id: String(item.id),
        code: String(item.code ?? ""),
        name: String(item.name ?? ""),
        level: Number(item.level ?? 0),
      }));
      setClassrooms(items);
    } catch (loadError) {
      setClassroomError(loadError instanceof Error ? loadError.message : "Gagal memuat classroom");
    }
  }, [api]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  const resource = useMemo(
    () => ({
      create: (input: Record<string, unknown>) => api.createStudent(input),
      delete: (id: string) => api.deleteStudent(id),
      get: (id: string) => api.getStudent(id),
      list: async (options: { limit: number; page: number; search?: string; status?: string }) => {
        const response = await api.listStudents(options);
        return {
          items: response.items as unknown as MasterDataRecord[],
          meta: response.meta,
        };
      },
      update: (id: string, input: Record<string, unknown>) => api.updateStudent(id, input),
    }),
    [api],
  );

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
        <ErrorState message={classroomError} onRetry={() => void loadClassrooms()} title="Gagal memuat referensi kelas" />
      ) : null}

      <ClassroomSummary classrooms={classrooms} />

      <PeoplePage
        description="Kelola data siswa, wali kelas, dan histori akademik dasar."
        excel={excel}
        extraRowActions={(item) => (
          <Button asChild size="sm" variant="soft">
            <Link href={`/admin/students/${item.id}/guardians`}>Wali</Link>
          </Button>
        )}
        fields={fields}
        resource={resource}
        statusOptions={["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]}
        title="Siswa"
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
