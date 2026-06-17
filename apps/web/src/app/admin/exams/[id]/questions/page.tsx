"use client";

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import type { ExamQuestionRecord } from "@nexsmsid/api-client";
import { Button, DataTable, ErrorState, Input, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type QuestionFormPayload = Record<string, string | number>;

export default function ExamQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const loadQuestions = useCallback(() => client.listExamQuestions(id), [client, id]);
  const { data, error, loading, refetch, setError } = useApiQuery<ExamQuestionRecord[]>(loadQuestions, [client, id]);
  const questions = (data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      String(row.content ?? "")
        .toLowerCase()
        .includes(needle) ||
      String(row.type ?? "")
        .toLowerCase()
        .includes(needle)
    );
  });

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload: QuestionFormPayload = {};
    for (const [key, value] of form.entries()) {
      if (key === "score") {
        payload[key] = Number(value);
        continue;
      }
      if (key === "number") {
        payload[key] = Number(value);
        continue;
      }
      payload[key] = String(value);
    }
    try {
      await client.addExamQuestion(id, payload);
      setShowForm(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah soal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(questionId: string) {
    try {
      await client.deleteExamQuestion(questionId);
      await refetch();
    } catch {
      setError("Gagal menghapus soal");
    }
  }

  const columns: DataTableColumn<ExamQuestionRecord>[] = [
    { header: "No", key: "number" },
    { header: "Tipe", key: "type", cell: (row) => row.type.replace(/_/g, " ") },
    { header: "Konten", key: "content", cell: (row) => <span className="max-w-xs truncate block">{row.content}</span> },
    { header: "Jawaban", key: "correctAnswer", cell: (row) => row.correctAnswer ?? "-" },
    { header: "Skor", key: "score" },
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
        breadcrumb={["Admin", "Ujian / CBT", "Soal"]}
        description="Kelola soal ujian."
        title="Soal Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4" /> Tambah Soal
      </Button>

      {showForm ? (
        <SectionCard title="Tambah Soal">
          <form className="max-w-xl space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">No</span>
                <Input name="number" type="number" placeholder="1" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Tipe</span>
                <select
                  className="w-full h-11 rounded-lg border border-input bg-card px-4 text-sm shadow-sm outline-none"
                  name="type"
                  required
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="ESSAY">Essay</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="MATCHING">Matching</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Skor</span>
                <Input name="score" type="number" placeholder="5" required />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Konten Soal</span>
              <textarea
                className="w-full min-h-24 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="content"
                required
                placeholder="Tulis soal di sini..."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jawaban Benar</span>
              <Input name="correctAnswer" placeholder="A / Benar / ..." />
            </label>
            <div className="flex gap-3">
              <Button disabled={submitting} type="submit">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
              </Button>
              <Button onClick={() => setShowForm(false)} type="button" variant="outline">
                Batal
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari soal..." searchValue={search} />
        }
        description={
          <>
            Total: <strong>{questions.length}</strong> soal
          </>
        }
        title="Daftar Soal"
      >
        <DataTable
          actions={(row) => (
            <Button onClick={() => handleDelete(row.id)} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          )}
          columns={columns}
          data={questions}
          emptyState={{ title: "Belum ada soal", description: "Tambah soal untuk ujian ini." }}
          getRowId={(row) => row.id}
          loading={loading}
          minWidth="min-w-[800px]"
        />
      </SectionCard>
    </div>
  );
}
