"use client";

import { useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { DataTable, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type TeacherDisciplineData = {
  violations: Array<{
    id: string;
    createdAt: string;
    student: { name: string; nis: string; classroom: { name: string } | null };
    rule: { name: string; category: string } | null;
  }>;
  achievements: Array<{
    id: string;
    createdAt: string;
    student: { name: string; nis: string; classroom: { name: string } | null };
    rule: { name: string; category: string } | null;
  }>;
};

export default function TeacherDisciplinePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadData = useCallback(() => api.getTeacherPortalDiscipline({ limit: 50 }) as Promise<TeacherDisciplineData>, [api]);
  const { data: data, error, loading } = useApiQuery(loadData, [api]);

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error) return <ErrorState message={error} title="Gagal memuat kedisiplinan" />;
  if (!data || (data.violations.length === 0 && data.achievements.length === 0))
    return <EmptyState description="Belum ada data kedisiplinan." title="Data kosong" />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Guru", "Kedisiplinan"]}
        description="Catatan pelanggaran dan prestasi siswa yang Anda input."
        eyebrow="Portal Guru"
        title="Kedisiplinan"
      />

      {data.violations.length > 0 ? (
        <SectionCard description={`${data.violations.length} pelanggaran tercatat`} title="Pelanggaran">
          <DataTable
            columns={[
              {
                key: "date",
                header: "Tanggal",
                cell: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString("id-ID") : "-"),
              },
              { key: "student", header: "Siswa", cell: (row: any) => row.student?.name ?? "-" },
              { key: "nis", header: "NIS", cell: (row: any) => row.student?.nis ?? "-" },
              { key: "classroom", header: "Kelas", cell: (row: any) => row.student?.classroom?.name ?? "-" },
              { key: "violation", header: "Pelanggaran", cell: (row: any) => row.rule?.name ?? "-" },
            ]}
            data={data.violations}
            getRowId={(row: any, idx) => row.id ?? idx}
          />
        </SectionCard>
      ) : null}

      {data.achievements.length > 0 ? (
        <SectionCard description={`${data.achievements.length} prestasi tercatat`} title="Prestasi">
          <DataTable
            columns={[
              {
                key: "date",
                header: "Tanggal",
                cell: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString("id-ID") : "-"),
              },
              { key: "student", header: "Siswa", cell: (row: any) => row.student?.name ?? "-" },
              { key: "nis", header: "NIS", cell: (row: any) => row.student?.nis ?? "-" },
              { key: "classroom", header: "Kelas", cell: (row: any) => row.student?.classroom?.name ?? "-" },
              { key: "achievement", header: "Prestasi", cell: (row: any) => row.rule?.name ?? "-" },
            ]}
            data={data.achievements}
            getRowId={(row: any, idx) => row.id ?? idx}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}
