"use client";

import { useCallback, useMemo, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { ChildSelector } from "@/components/child-selector";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Grade = {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  assessment: {
    name: string;
    type: string;
    maxScore: number;
    teachingAssignment?: { subject?: { name: string }; teacher?: { name: string } } | null;
  };
};

const TYPE_LABEL: Record<string, string> = { DAILY: "Harian", QUIZ: "Kuis", MIDTERM: "PTS", FINAL: "PAS", PROJECT: "Proyek" };
const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = { APPROVED: "success", PENDING: "warning", DRAFT: "secondary" };

export default function GuardianGradesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [childId, setChildId] = useState<string | null>(null);

  const loadGrades = useCallback(() => api.getGuardianPortalChildGrades(childId as string) as Promise<Grade[]>, [api, childId]);
  const { data: itemsData, error, loading } = useApiQuery(loadGrades, [api, childId], { enabled: Boolean(childId) });
  const items = itemsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Wali", "Nilai"]}
        description="Daftar nilai anak yang Anda pilih"
        eyebrow="Portal Wali"
        title="Nilai Anak"
      />
      <ChildSelector onChange={setChildId} />
      {!childId ? (
        <EmptyState description="Pilih anak terlebih dahulu." title="Pilih anak" />
      ) : loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorState message={error} title="Gagal memuat nilai" />
      ) : items.length === 0 ? (
        <EmptyState description="Belum ada nilai untuk anak ini." title="Belum ada nilai" />
      ) : (
        <SectionCard description={`${items.length} nilai`} title="Daftar Nilai">
          <ul className="divide-y divide-border">
            {items.map((g) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={g.id}>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" /> {g.assessment.teachingAssignment?.subject?.name ?? "-"} —{" "}
                    {g.assessment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[g.assessment.type] ?? g.assessment.type} • {g.assessment.teachingAssignment?.teacher?.name ?? "-"} •{" "}
                    {new Date(g.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
      )}
    </div>
  );
}
