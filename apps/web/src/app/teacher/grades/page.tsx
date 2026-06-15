"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Plus } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, FormModal, Input, PageHeader, SectionCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Assessment = {
  id: string;
  name: string;
  type: string;
  maxScore: number;
  weight: number;
  date: string;
  teachingAssignment?: { subject?: { name: string }; classroom?: { name: string } } | null;
  _count?: { grades: number };
};

type TeachingAssignment = {
  id: string;
  subject?: { name: string } | null;
  classroom?: { name: string } | null;
};

const ASSESSMENT_TYPES = [
  { value: "DAILY", label: "Harian" },
  { value: "QUIZ", label: "Kuis" },
  { value: "MIDTERM", label: "PTS" },
  { value: "FINAL", label: "PAS" },
  { value: "PROJECT", label: "Proyek" },
];

const TYPE_LABEL: Record<string, string> = {
  DAILY: "Harian",
  QUIZ: "Kuis",
  MIDTERM: "PTS",
  FINAL: "PAS",
  PROJECT: "Proyek",
};

export default function TeacherGradesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [assessments, assignments] = await Promise.all([
      api.getTeacherPortalAssessments() as Promise<Assessment[]>,
      api.getTeacherPortalTeachingAssignments() as Promise<TeachingAssignment[]>,
    ]);
    return { assessments, assignments };
  }, [api]);
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadData, [api]);
  const items = data?.assessments ?? [];
  const teachingAssignments = data?.assignments ?? [];
  const error = actionError ?? fetchError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      teachingAssignmentId: formData.get("teachingAssignmentId"),
      name: formData.get("name"),
      type: formData.get("type"),
      maxScore: Number(formData.get("maxScore")),
      weight: Number(formData.get("weight")),
      description: formData.get("description") || "",
    };
    const dueDate = formData.get("dueDate");
    if (dueDate) payload.dueDate = dueDate;

    try {
      const created = await api.createAssessment(payload);
      setFormOpen(false);
      await refetch();
      if (created?.id) {
        window.location.href = `/teacher/grades/${created.id}`;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membuat penilaian");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Assessment Baru
          </Button>
        }
        breadcrumb={["Portal Guru", "Penilaian"]}
        description="Daftar penilaian aktif dan buat assessment baru untuk kelas Anda."
        eyebrow="Portal Guru"
        title="Penilaian Saya"
      />

      {error ? <ErrorState message={error} title="Terjadi kesalahan" /> : null}

      {items.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => setFormOpen(true)} variant="soft">
              Buat assessment pertama
            </Button>
          }
          description="Belum ada penilaian."
          title="Belum ada data"
        />
      ) : (
        <SectionCard description={`${items.length} penilaian`} title="Daftar Penilaian">
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={a.id}>
                <Link className="min-w-0 flex-1" href={`/teacher/grades/${a.id}`}>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {a.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABEL[a.type] ?? a.type} • {a.teachingAssignment?.subject?.name ?? "-"} •{" "}
                      {a.teachingAssignment?.classroom?.name ?? "-"} •{" "}
                      {new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant="info">Bobot {a.weight}</Badge>
                  <Badge variant="secondary">Max {a.maxScore}</Badge>
                  <Badge variant="outline">{a._count?.grades ?? 0} nilai</Badge>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Assessment Baru">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-muted-foreground">Nama Assessment</span>
            <Input name="name" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tipe</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue="DAILY"
              name="type"
              required
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Penugasan Mengajar</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="teachingAssignmentId"
              required
            >
              <option value="" disabled>
                Pilih Guru - Mapel - Kelas
              </option>
              {teachingAssignments.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.subject?.name ?? "-"} — {ta.classroom?.name ?? "-"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tanggal Deadline</span>
            <Input name="dueDate" type="date" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor Maksimal</span>
            <Input defaultValue={100} name="maxScore" required type="number" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Bobot (%)</span>
            <Input defaultValue={1} name="weight" required type="number" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-muted-foreground">Deskripsi</span>
            <Input name="description" />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
