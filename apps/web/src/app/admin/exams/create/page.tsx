"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button, ErrorState, Input, PageHeader } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamFormPayload = Record<string, string | number | boolean>;

export default function CreateExamPage() {
  const router = useRouter();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await client.createExam(payload);
      router.push("/admin/exams");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat ujian");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/exams">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Buat Ujian"]}
        description="Buat ujian baru dengan mengisi form berikut."
        title="Buat Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal menyimpan" /> : null}

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tipe Ujian</span>
            <EntityPicker entityType="exam-type" name="examTypeId" placeholder="Cari tipe ujian..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tahun Ajaran</span>
            <EntityPicker entityType="academic-year" name="academicYearId" placeholder="Cari tahun ajaran..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kode</span>
            <Input name="code" placeholder="CTH-001" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Nama</span>
            <Input name="name" placeholder="Ujian Tengah Semester" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Durasi (menit)</span>
            <Input name="duration" type="number" placeholder="120" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Total Soal</span>
            <Input name="totalQuestions" type="number" placeholder="40" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor Maksimal</span>
            <Input name="maxScore" type="number" placeholder="100" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Skor Lulus</span>
            <Input name="passingScore" type="number" placeholder="60" />
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
            <input name="isCbt" type="checkbox" defaultChecked />
            Ujian CBT (Berbasis Komputer)
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Deskripsi</span>
          <textarea
            className="w-full min-h-20 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="description"
            placeholder="Deskripsi ujian"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Instruksi</span>
          <textarea
            className="w-full min-h-28 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="instruction"
            placeholder="Instruksi pengerjaan ujian"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-muted-foreground">Catatan</span>
          <textarea
            className="w-full min-h-20 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            name="notes"
            placeholder="Catatan internal"
          />
        </label>

        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/exams">Batal</Link>
          </Button>
          <Button disabled={submitting} type="submit">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
