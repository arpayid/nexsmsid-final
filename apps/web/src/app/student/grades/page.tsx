"use client";

import { useCallback, useMemo } from "react";
import { GraduationCap, Loader2 } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Grade = {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  assessment: {
    id: string;
    name: string;
    type: string;
    maxScore: number;
    teachingAssignment?: { subject?: { name: string }; teacher?: { name: string } } | null;
  };
};

const TYPE_LABEL: Record<string, string> = { DAILY: "Harian", QUIZ: "Kuis", MIDTERM: "PTS", FINAL: "PAS", PROJECT: "Proyek" };
const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = { APPROVED: "success", PENDING: "warning", DRAFT: "secondary" };

export default function StudentGradesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadGrades = useCallback(() => api.getStudentPortalGrades() as Promise<Grade[]>, [api]);
  const { data: itemsData, error, loading } = useApiQuery(loadGrades, [api]);
  const items = itemsData ?? [];

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error) return <ErrorState message={error} title="Gagal memuat nilai" />;
  if (items.length === 0) return <EmptyState description="Belum ada nilai." title="Belum ada nilai" />;

  const grouped = items.reduce<Record<string, Grade[]>>((acc, g) => {
    const subject = g.assessment.teachingAssignment?.subject?.name ?? "Lainnya";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Siswa", "Nilai"]}
        description="Daftar nilai per mata pelajaran"
        eyebrow="Portal Siswa"
        title="Nilai Saya"
      />
      {Object.entries(grouped).map(([subject, grades]) => {
        const avg = grades.length === 0 ? 0 : Math.round((grades.reduce((s, g) => s + g.score, 0) / grades.length) * 10) / 10;
        return (
          <SectionCard
            key={subject}
            description={`Rata-rata ${avg} dari ${grades.length} penilaian`}
            title={
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> {subject}
              </span>
            }
          >
            <ul className="divide-y divide-border">
              {grades.map((g) => (
                <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={g.id}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.assessment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABEL[g.assessment.type] ?? g.assessment.type} • {g.assessment.teachingAssignment?.teacher?.name ?? "-"} •{" "}
                      {new Date(g.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[g.status] ?? "secondary"}>{g.status}</Badge>
                    <Badge variant="outline">
                      {g.score} / {g.assessment.maxScore}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        );
      })}
    </div>
  );
}
