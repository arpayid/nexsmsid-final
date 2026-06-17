"use client";

import { ArrowLeft, Calendar, Clock, Edit3, FileText, Layers, Loader2, Printer, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import type { ExamRecord } from "@nexsmsid/api-client";
import { Button, ErrorState, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [printing, setPrinting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadExam = useCallback(() => client.getExam(id), [client, id]);
  const { data: exam, error: fetchError, loading } = useApiQuery<ExamRecord>(loadExam, [client, id]);
  const error = actionError ?? fetchError;

  async function handlePrintAllCards() {
    setPrinting(true);
    setActionError(null);
    try {
      await client.downloadExamCardPdf(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mencetak kartu ujian");
    } finally {
      setPrinting(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Memuat detail ujian...</div>;
  if (error || !exam) return <ErrorState message={error ?? "Data tidak ditemukan"} title="Gagal memuat" />;

  const info: Array<{ label: string; value: ReactNode }> = [
    { label: "Kode", value: exam.code },
    { label: "Nama", value: exam.name },
    { label: "Tipe", value: exam.examType?.name ?? "-" },
    { label: "Durasi", value: `${exam.duration} menit` },
    { label: "Total Soal", value: String(exam.totalQuestions ?? "-") },
    { label: "Skor Maksimal", value: String(exam.maxScore ?? "-") },
    { label: "Skor Lulus", value: String(exam.passingScore ?? "-") },
    { label: "CBT", value: exam.isCbt ? "Ya" : "Tidak" },
    { label: "Status", value: <StatusBadge value={exam.status} /> },
  ];

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
        breadcrumb={["Admin", "Ujian / CBT", exam.code]}
        description={exam.description ?? "Detail ujian"}
        title={exam.name}
      />

      <SectionCard title="Informasi Ujian">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((item) => (
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3" key={item.label}>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {exam.instruction ? (
        <SectionCard title="Instruksi">
          <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">{exam.instruction}</p>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild className="h-24 flex-col gap-2" variant="outline">
          <Link href={`/admin/exams/${id}/schedule`}>
            <Calendar className="h-6 w-6" /> Jadwal ({exam.schedules?.length ?? 0})
          </Link>
        </Button>
        <Button asChild className="h-24 flex-col gap-2" variant="outline">
          <Link href={`/admin/exams/${id}/participants`}>
            <Users className="h-6 w-6" /> Peserta ({exam._count?.participants ?? 0})
          </Link>
        </Button>
        <Button asChild className="h-24 flex-col gap-2" variant="outline">
          <Link href={`/admin/exams/${id}/questions`}>
            <FileText className="h-6 w-6" /> Soal ({exam._count?.questions ?? 0})
          </Link>
        </Button>
        <Button asChild className="h-24 flex-col gap-2" variant="outline">
          <Link href={`/admin/exams/${id}/results`}>
            <Layers className="h-6 w-6" /> Hasil
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/admin/exams/${id}/edit`}>
            <Edit3 className="h-4 w-4" /> Edit Ujian
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/admin/exams/${id}/sessions`}>
            <Clock className="h-4 w-4" /> Sesi Ujian
          </Link>
        </Button>
        <Button disabled={printing} onClick={() => void handlePrintAllCards()} variant="outline">
          {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Cetak Semua Kartu
        </Button>
      </div>
    </div>
  );
}
