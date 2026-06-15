"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { AssessmentDetail } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ErrorState, Input, PageHeader } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{assessment.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {assessment.teachingAssignment?.subject?.name ?? "-"} • {assessment.teachingAssignment?.classroom?.name ?? "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">Max {assessment.maxScore}</Badge>
            <Badge variant="outline">{assessment.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {assessment.grades.map((grade) => (
                  <tr className="border-b" key={grade.studentId}>
                    <td className="px-3 py-3 font-medium">{grade.student?.name ?? grade.studentId}</td>
                    <td className="px-3 py-3">
                      <Input
                        max={assessment.maxScore}
                        min={0}
                        onChange={(event) => setScoreOverrides((prev) => ({ ...prev, [grade.studentId]: Number(event.target.value) || 0 }))}
                        type="number"
                        value={scoreOverrides[grade.studentId] ?? grade.score}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Nilai
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
