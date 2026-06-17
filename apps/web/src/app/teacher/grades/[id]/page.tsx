"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { AssessmentDetail } from "@nexsmsid/api-client";
import { Badge, Button, DataTable, ErrorState, Input, PageHeader, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type GradeRow = AssessmentDetail["grades"][number];

export default function TeacherGradeDetailPage() {
  const params = useParams<{ id: string }>();
  const api = useMemo(() => createBrowserApiClient(), []);
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAssessment = useCallback(() => api.getAssessmentDetail(params.id), [api, params.id]);
  const { data: assessment, error: fetchError, loading, refetch } = useApiQuery<AssessmentDetail>(loadAssessment, [api, params.id]);

  async function handleSave() {
    if (!assessment) return;
    setSaving(true);
    setActionError(null);
    try {
      const scoresArray = assessment.grades.map((grade) => ({
        studentId: grade.studentId,
        score: scoreOverrides[grade.studentId] ?? grade.score,
      }));
      await api.inputScores(assessment.id, { scores: scoresArray });
      setScoreOverrides({});
      await refetch();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  }

  const error = actionError ?? fetchError;

  const columns = useMemo<DataTableColumn<GradeRow>[]>(() => {
    if (!assessment) return [];
    return [
      {
        header: "Siswa",
        key: "student",
        cell: (row) => row.student?.name ?? row.studentId,
      },
      {
        header: "Nilai",
        key: "score",
        cell: (row) => (
          <Input
            max={assessment.maxScore}
            min={0}
            onChange={(event) => setScoreOverrides((prev) => ({ ...prev, [row.studentId]: Number(event.target.value) || 0 }))}
            type="number"
            value={scoreOverrides[row.studentId] ?? row.score}
          />
        ),
      },
    ];
  }, [assessment, scoreOverrides]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !assessment) return <ErrorState message={error} title="Gagal memuat penilaian" />;
  if (!assessment) return <ErrorState message="Penilaian tidak ditemukan" title="Tidak ditemukan" />;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/grades">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
        breadcrumb={["Portal Guru", "Penilaian", "Input Nilai"]}
        description="Masukkan nilai siswa untuk assessment ini."
        eyebrow="Portal Guru"
        title={assessment.name}
      />

      {actionError ? <ErrorState message={actionError} title="Terjadi kesalahan" /> : null}

      <SectionCard
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Max {assessment.maxScore}</Badge>
            <Badge variant="outline">{assessment.type}</Badge>
            <Button disabled={saving} onClick={() => void handleSave()} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Nilai
            </Button>
          </div>
        }
        description={`${assessment.teachingAssignment?.subject?.name ?? "-"} • ${assessment.teachingAssignment?.classroom?.name ?? "-"}`}
        title={assessment.name}
      >
        <DataTable columns={columns} data={assessment.grades} getRowId={(row) => row.studentId} minWidth="min-w-[520px]" />
      </SectionCard>
    </div>
  );
}
