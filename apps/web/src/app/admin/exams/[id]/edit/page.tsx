"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { ExamRecord } from "@nexsmsid/api-client";
import { Button, ErrorState, Input, PageHeader } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamFormPayload = Record<string, string | number | boolean>;

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [submitting, setSubmitting] = useState(false);

  const loadExam = useCallback(() => client.getExam(id), [client, id]);
  const { data: exam, error, loading, setError } = useApiQuery<ExamRecord>(loadExam, [client, id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: ExamFormPayload = {};
    for (const [key, value] of form.entries()) {
      if (key === "isCbt") {
        payload[key] = value === "on";
        continue;
      }
      if (["duration", "totalQuestions", "maxScore", "passingScore"].includes(key)) {
        payload[key] = Number(value);
        continue;
      }
      payload[key] = String(value);
    }
    try {
      await client.updateExam(id, payload);
      router.push(`/admin/exams/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui ujian");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Memuat data...</div>;
  if (!exam) return <ErrorState message="Data tidak ditemukan" title="Gagal memuat" />;

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
        breadcrumb={["Admin", "Ujian / CBT", exam.code, "Edit"]}
        description="Perbarui data ujian."
        title={`Edit ${exam.name}`}
      />

      {error ? <ErrorState message={error} title="Gagal menyimpan" /> : null}

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tipe Ujian</span>
            <EntityPicker
              defaultValue={exam.examTypeId}
              entityType="exam-type"
              name="examTypeId"
              placeholder="Cari tipe ujian..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tahun Ajaran</span>
            <EntityPicker
              defaultValue={exam.academicYearId}
              entityType="academic-year"
              name="academicYearId"
              placeholder="Cari tahun ajaran..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kode</span>
            <Input name="code" defaultValue={exam.code} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Nama</span>
            <Input name="name" defaultValue={exam.name} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Durasi (menit)</span>
            <Input name="duration" type="number" defaultValue={exam.duration} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Total Soal</span>
            <Input name="totalQuestions" type="number" defaultValue={exam.totalQuestions ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor Maksimal</span>
            <Input name="maxScore" type="number" defaultValue={exam.maxScore ?? ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor Lulus</span>
            <Input name="passingScore" type="number" defaultValue={exam.passingScore ?? ""} />
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
            <input name="isCbt" type="checkbox" defaultChecked={exam.isCbt} />
            Ujian CBT (Berbasis Komputer)
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Deskripsi</span>
          <textarea
            className="w-full min-h-20 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="description"
            defaultValue={exam.description ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Instruksi</span>
          <textarea
            className="w-full min-h-28 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="instruction"
            defaultValue={exam.instruction ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Catatan</span>
          <textarea
            className="w-full min-h-20 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="notes"
            defaultValue={exam.notes ?? ""}
          />
        </label>

        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/admin/exams/${id}`}>Batal</Link>
          </Button>
          <Button disabled={submitting} type="submit">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
