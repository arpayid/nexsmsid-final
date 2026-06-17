"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import { Button, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamResultRow = {
  id?: string;
  participantName?: string;
  participantId?: string;
  questionNumber?: number;
  questionId?: string;
  answer?: string | null;
  score?: number | null;
};

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const client = useMemo(() => createBrowserApiClient(), []);
  const page = searchParams.get("page") ?? "";
  const [search, setSearch] = useState("");

  const loadResults = useCallback(async () => {
    const params: Record<string, string> = {};
    if (page) params.page = page;
    const res = await client.listExamResults(id, params);
    return res.data;
  }, [client, id, page]);

  const { data, error, loading } = useApiQuery<ExamResultRow[]>(loadResults, [client, id, page]);
  const results = (data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return String(row.participantName ?? row.participantId ?? "")
      .toLowerCase()
      .includes(needle);
  });

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  const columns: DataTableColumn<ExamResultRow>[] = [
    { header: "Peserta", key: "participant", cell: (row) => row.participantName ?? row.participantId ?? "-" },
    { header: "Soal", key: "questionNumber", cell: (row) => row.questionNumber ?? row.questionId ?? "-" },
    { header: "Jawaban", key: "answer", cell: (row) => row.answer ?? "-" },
    { header: "Skor", key: "score", cell: (row) => row.score ?? "-" },
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
        breadcrumb={["Admin", "Ujian / CBT", "Hasil"]}
        description="Lihat hasil ujian peserta."
        title="Hasil Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari peserta..." searchValue={search} />
        }
        description={
          <>
            Total: <strong>{results.length}</strong> baris hasil
          </>
        }
        title="Daftar Hasil"
      >
        <DataTable
          columns={columns}
          data={results}
          emptyState={{ title: "Belum ada hasil", description: "Hasil akan muncul setelah peserta mengerjakan ujian." }}
          getRowId={(row, i) => row.id ?? `row-${i}`}
          loading={loading}
          minWidth="min-w-[700px]"
        />
      </SectionCard>
    </div>
  );
}
