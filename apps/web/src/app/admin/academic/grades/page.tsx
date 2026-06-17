"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Eye, Loader2, Plus, Printer, RefreshCcw, Save } from "lucide-react";

import type { AssessmentDetail, AssessmentRecord } from "@nexsmsid/api-client";
import { Badge, Button, DataTable, ErrorState, FormModal, Input, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const ASSESSMENT_TYPES = [
  { value: "DAILY", label: "Harian" },
  { value: "ASSIGNMENT", label: "Tugas" },
  { value: "QUIZ", label: "Kuis" },
  { value: "MIDTERM", label: "UTS" },
  { value: "FINAL", label: "UAS" },
  { value: "PRACTICAL", label: "Praktik" },
  { value: "PROJECT", label: "Proyek" },
];

const statusBadge: Record<string, "success" | "warning" | "info" | "outline" | "secondary"> = {
  DRAFT: "outline",
  SUBMITTED: "info",
  APPROVED: "success",
  PUBLISHED: "secondary",
};

export default function GradesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(
    () => api.listAssessments({ limit: 50, page: 1, search: appliedSearch || undefined }),
    [api, appliedSearch],
  );
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const assessments = data?.items ?? [];
  const total = data?.meta?.total ?? assessments.length;
  const error = actionError ?? fetchError;

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [savingScores, setSavingScores] = useState(false);

  const [recapOpen, setRecapOpen] = useState(false);
  const [recapClassroomId, setRecapClassroomId] = useState<string>("");
  const [recapSemesterId, setRecapSemesterId] = useState<string>("");
  const [recapBusy, setRecapBusy] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  async function handleDownloadRecap() {
    if (!recapClassroomId) {
      setActionError("Pilih kelas terlebih dahulu");
      return;
    }
    setActionError(null);
    setRecapBusy(true);
    try {
      const blob = await api.downloadGradeRecapPdf(recapClassroomId, { semesterId: recapSemesterId || undefined });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setRecapOpen(false);
    } catch (recapError) {
      setActionError(recapError instanceof Error ? recapError.message : "Gagal membuat rekap nilai");
    } finally {
      setRecapBusy(false);
    }
  }

  function openCreate() {
    setEditingAssessment(null);
    setFormOpen(true);
  }

  function openEdit(item: AssessmentRecord) {
    setEditingAssessment(item);
    setFormOpen(true);
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    setActionError(null);
    try {
      const assessment = await api.getAssessmentDetail(id);
      setSelectedAssessment(assessment);
      const scoreMap: Record<string, number> = {};
      for (const grade of assessment.grades) {
        scoreMap[grade.studentId] = grade.score;
      }
      setScores(scoreMap);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memuat detail nilai");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSaveScores() {
    if (!selectedAssessment) return;
    setSavingScores(true);
    setActionError(null);
    try {
      const scoresArray = Object.entries(scores).map(([studentId, score]) => ({ studentId, score }));
      await api.inputScores(selectedAssessment.id, { scores: scoresArray });
      await openDetail(selectedAssessment.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setSavingScores(false);
    }
  }

  async function handleApprove() {
    if (!selectedAssessment) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.approveScores(selectedAssessment.id);
      await openDetail(selectedAssessment.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal approve nilai");
    } finally {
      setSubmitting(false);
    }
  }

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
      if (editingAssessment) {
        await api.updateAssessment(editingAssessment.id, payload);
      } else {
        await api.createAssessment(payload);
      }
      setFormOpen(false);
      setEditingAssessment(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan assessment");
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel = useCallback((type: string) => ASSESSMENT_TYPES.find((t) => t.value === type)?.label ?? type, []);

  const columns: DataTableColumn<AssessmentRecord>[] = [
    {
      cell: (a) => a.name,
      header: "Nama",
      key: "name",
    },
    {
      cell: (a) => <Badge variant="secondary">{typeLabel(a.type)}</Badge>,
      header: "Tipe",
      key: "type",
    },
    {
      cell: (a) => a.teachingAssignment?.subject?.name ?? "-",
      header: "Mapel",
      key: "subject",
    },
    {
      cell: (a) => a.teachingAssignment?.classroom?.name ?? "-",
      header: "Kelas",
      key: "classroom",
    },
    {
      cell: (a) => a.maxScore,
      header: "Skor Maks",
      key: "maxScore",
    },
    {
      cell: (a) => `${a.weight}%`,
      header: "Bobot",
      key: "weight",
    },
    {
      cell: (a) => a._count?.grades ?? 0,
      header: "Nilai",
      key: "grades",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setRecapOpen(true)} variant="soft">
              <Printer className="h-4 w-4" /> Cetak Rekap
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Assessment Baru
            </Button>
          </>
        }
        breadcrumb={["Admin", "Akademik", "Nilai"]}
        description="Kelola assessment, input nilai, approve, dan publish."
        eyebrow="Akademik"
        title="Nilai Siswa"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses nilai" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari assessment, mapel..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar assessment per penugasan mengajar. Total: <strong>{total}</strong> assessment.
          </>
        }
        title="Daftar Assessment"
      >
        <DataTable
          actions={(a) => (
            <>
              <Button onClick={() => openEdit(a)} size="sm" variant="outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => openDetail(a.id)} size="sm" variant="soft">
                <Eye className="h-4 w-4" /> Nilai
              </Button>
            </>
          )}
          columns={columns}
          data={assessments}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Buat assessment pertama
              </Button>
            ),
            description: "Belum ada assessment atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(a) => a.id}
          loading={loading}
          minWidth="min-w-[700px]"
        />
      </SectionCard>

      <FormModal
        description="Pilih kelas dan semester untuk rekap nilai PDF."
        onClose={() => setRecapOpen(false)}
        open={recapOpen}
        title="Cetak Rekap Nilai"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleDownloadRecap();
          }}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kelas</span>
            <EntityPicker
              entityType="classroom"
              name="classroomId"
              onChange={setRecapClassroomId}
              placeholder="Cari kelas..."
              required
              value={recapClassroomId}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Semester (opsional)</span>
            <EntityPicker
              entityType="semester"
              name="semesterId"
              onChange={setRecapSemesterId}
              placeholder="— Semester Aktif —"
              value={recapSemesterId}
            />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setRecapOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={recapBusy} type="submit">
              {recapBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak PDF
            </Button>
          </div>
        </form>
      </FormModal>

      <FormModal
        description="Lengkapi detail assessment dan penugasan mengajar."
        onClose={() => {
          setFormOpen(false);
          setEditingAssessment(null);
        }}
        open={formOpen}
        title={`${editingAssessment ? "Edit" : "Buat"} Assessment`}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Nama Assessment</span>
            <Input defaultValue={editingAssessment?.name ?? ""} name="name" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tipe</span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={editingAssessment?.type ?? "DAILY"}
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
            <span className="text-sm font-semibold text-foreground">Penugasan Mengajar</span>
            <EntityPicker
              defaultValue={((editingAssessment as Record<string, unknown>)?.teachingAssignmentId as string) ?? ""}
              entityType="teaching-assignment"
              name="teachingAssignmentId"
              placeholder="Cari guru — mapel — kelas..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal Deadline</span>
            <Input defaultValue={editingAssessment?.dueDate?.slice(0, 10) ?? ""} name="dueDate" type="date" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Skor Maksimal</span>
            <Input defaultValue={editingAssessment?.maxScore ?? 100} name="maxScore" required type="number" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Bobot (%)</span>
            <Input defaultValue={editingAssessment?.weight ?? 1} name="weight" required type="number" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-foreground">Deskripsi</span>
            <Input defaultValue={editingAssessment?.description ?? ""} name="description" />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button
              onClick={() => {
                setFormOpen(false);
                setEditingAssessment(null);
              }}
              type="button"
              variant="outline"
            >
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </div>
        </form>
      </FormModal>

      {detailLoading ? (
        <SectionCard description="Memuat nilai siswa..." title="Detail Assessment">
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : selectedAssessment ? (
        <SectionCard
          action={
            <div className="flex flex-wrap gap-2">
              {selectedAssessment.grades.every((g) => g.status !== "APPROVED" && g.status !== "PUBLISHED") ? (
                <Button disabled={submitting} onClick={() => void handleApprove()} variant="soft">
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              ) : null}
              <Button onClick={() => setSelectedAssessment(null)} variant="outline">
                Tutup
              </Button>
            </div>
          }
          description={
            <>
              {typeLabel(selectedAssessment.type)} · Skor Maks: {selectedAssessment.maxScore} · Bobot: {selectedAssessment.weight}% ·{" "}
              {selectedAssessment.teachingAssignment?.subject?.name ?? ""} — {selectedAssessment.teachingAssignment?.classroom?.name ?? ""}{" "}
              · Total: <strong>{selectedAssessment.grades.length}</strong> siswa
            </>
          }
          title={selectedAssessment.name}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">NIS</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Nilai</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedAssessment.grades.map((grade) => (
                  <tr className="border-b last:border-0" key={grade.studentId}>
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-muted-foreground">{grade.student.nis}</td>
                    <td className="px-4 py-4 font-semibold text-muted-foreground">{grade.student.name}</td>
                    <td className="px-4 py-4">
                      {grade.status === "APPROVED" || grade.status === "PUBLISHED" ? (
                        <span className="font-bold text-muted-foreground">{grade.score}</span>
                      ) : (
                        <Input
                          className="w-24"
                          defaultValue={scores[grade.studentId] ?? grade.score}
                          max={selectedAssessment.maxScore}
                          min={0}
                          name={`score-${grade.studentId}`}
                          onChange={(e) => setScores((prev) => ({ ...prev, [grade.studentId]: Number(e.target.value) }))}
                          type="number"
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadge[grade.status] ?? "outline"}>{grade.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            {selectedAssessment.grades.some((g) => g.status !== "APPROVED" && g.status !== "PUBLISHED") ? (
              <Button disabled={savingScores} onClick={() => void handleSaveScores()}>
                {savingScores ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Nilai
              </Button>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
