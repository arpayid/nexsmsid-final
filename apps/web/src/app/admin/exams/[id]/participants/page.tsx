"use client";

import { ArrowLeft, Loader2, Printer, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";

import type { ExamParticipantRecord } from "@nexsmsid/api-client";
import { Button, DataTable, ErrorState, FormModal, Input, PageHeader } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function ExamParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [studentId, setStudentId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradingParticipant, setGradingParticipant] = useState<ExamParticipantRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadParticipants = useCallback(async () => {
    const res = await client.listExamParticipants(id);
    return res.data;
  }, [client, id]);

  const { data, error, loading, refetch, setError } = useApiQuery<ExamParticipantRecord[]>(loadParticipants, [client, id]);
  const participants = data ?? [];

  async function handleAdd() {
    if (!studentId.trim()) return;
    setAdding(true);
    try {
      await client.addExamParticipant(id, studentId.trim());
      setStudentId("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah peserta");
    } finally {
      setAdding(false);
    }
  }

  async function handleBulkAdd() {
    if (!classroomId.trim()) return;
    setBulkAdding(true);
    setError(null);
    try {
      const students = await client.listStudents({ classroomId, limit: 500, page: 1 });
      const studentIds = students.items.map((s) => s.id);
      if (studentIds.length === 0) {
        setError("Kelas tidak memiliki siswa aktif");
        return;
      }
      await client.addExamParticipantsBulk(id, studentIds);
      setClassroomId("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah peserta per kelas");
    } finally {
      setBulkAdding(false);
    }
  }

  async function handleRemove(participantId: string) {
    try {
      await client.removeExamParticipant(id, participantId);
      await refetch();
    } catch {
      setError("Gagal menghapus peserta");
    }
  }

  async function handleGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gradingParticipant) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await client.gradeExamParticipant(id, gradingParticipant.id, {
        score: Number(formData.get("score")),
        notes: (formData.get("notes") as string) || undefined,
      });
      setGradeOpen(false);
      setGradingParticipant(null);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrintCard(participantId: string) {
    setError(null);
    try {
      await client.downloadExamParticipantCardPdf(id, participantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencetak kartu");
    }
  }

  const columns: DataTableColumn<ExamParticipantRecord>[] = [
    { header: "No", key: "number", cell: (row) => row.number ?? "-" },
    { header: "Siswa", key: "student", cell: (row) => row.student?.name ?? row.studentId },
    { header: "Status", key: "status", cell: (row) => row.status },
    { header: "Nilai", key: "score", cell: (row) => (row.score != null ? String(row.score) : "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/exams/${id}`}>
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Peserta"]}
        description="Kelola peserta ujian."
        title="Peserta Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex items-end gap-3">
          <label className="flex-1 space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Siswa</span>
            <EntityPicker entityType="student" onChange={setStudentId} placeholder="Cari siswa..." value={studentId} />
          </label>
          <Button disabled={adding || !studentId.trim()} onClick={() => void handleAdd()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Tambah
          </Button>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex-1 space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tambah per Kelas</span>
            <EntityPicker entityType="classroom" onChange={setClassroomId} placeholder="Pilih kelas..." value={classroomId} />
          </label>
          <Button disabled={bulkAdding || !classroomId.trim()} onClick={() => void handleBulkAdd()} variant="outline">
            {bulkAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Tambah Kelas
          </Button>
        </div>
      </div>

      <DataTable
        actions={(row) => (
          <>
            <Button
              onClick={() => {
                setGradingParticipant(row);
                setGradeOpen(true);
              }}
              size="sm"
              variant="soft"
            >
              Nilai
            </Button>
            <Button onClick={() => void handlePrintCard(row.id)} size="sm" variant="outline">
              <Printer className="h-4 w-4" /> Cetak
            </Button>
            <Button onClick={() => void handleRemove(row.id)} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </>
        )}
        columns={columns}
        data={participants}
        emptyState={{ title: "Belum ada peserta", description: "Tambah peserta satu per satu atau per kelas." }}
        getRowId={(row) => row.id}
        loading={loading}
      />

      <FormModal
        onClose={() => {
          setGradeOpen(false);
          setGradingParticipant(null);
        }}
        open={gradeOpen}
        title={`Nilai — ${gradingParticipant?.student?.name ?? "Peserta"}`}
      >
        <form className="space-y-4" onSubmit={handleGrade}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor</span>
            <Input
              defaultValue={gradingParticipant?.score != null ? String(gradingParticipant.score) : ""}
              max={100}
              min={0}
              name="score"
              required
              type="number"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Catatan</span>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={gradingParticipant?.notes ?? ""}
              name="notes"
              rows={3}
            />
          </label>
          <div className="flex gap-3">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button
              onClick={() => {
                setGradeOpen(false);
                setGradingParticipant(null);
              }}
              type="button"
              variant="outline"
            >
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
