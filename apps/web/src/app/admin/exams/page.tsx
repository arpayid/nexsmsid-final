"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { BarChart3, Edit3, Eye, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";
import Link from "next/link";

import type { ExamRecord } from "@nexsmsid/api-client";
import { Button, ConfirmDialog, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function ExamsPage() {
  const client = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const params: Record<string, string> = {};
    if (appliedSearch) params.search = appliedSearch;
    if (appliedStatus) params.status = appliedStatus;
    const res = await client.listExams(params);
    return res.data;
  }, [client, appliedSearch, appliedStatus]);

  const { data, error: queryError, loading, refetch } = useApiQuery<ExamRecord[]>(loadData, [client, appliedSearch, appliedStatus]);
  const exams = data ?? [];
  const error = actionError ?? queryError;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    setAppliedStatus(statusFilter);
    await refetch();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await client.deleteExam(pendingDelete);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus ujian");
    }
    setPendingDelete(null);
    await refetch();
  }

  const columns: DataTableColumn<ExamRecord>[] = [
    { header: "Kode", key: "code", cell: (row) => <span className="font-mono font-bold">{row.code}</span> },
    { header: "Nama", key: "name", cell: (row) => <span className="font-bold">{row.name}</span> },
    { header: "Tipe", key: "examType", cell: (row) => row.examType?.name ?? "-" },
    { header: "Durasi (menit)", key: "duration" },
    { header: "Status", key: "status", cell: (row) => <StatusBadge value={row.status} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/exams/reports">
                <BarChart3 className="h-4 w-4" /> Laporan
              </Link>
            </Button>
            <Button onClick={() => void refetch()} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/exams/create">
                <Plus className="h-4 w-4" /> Buat Ujian
              </Link>
            </Button>
          </>
        }
        breadcrumb={["Admin", "Ujian / CBT"]}
        description="Kelola data ujian, jadwal, peserta, sesi, soal, dan hasil."
        eyebrow="Ujian / CBT"
        title="Data Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal memuat data" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            filters={[
              {
                label: "Status",
                onChange: setStatusFilter,
                options: statusOptions,
                placeholder: "Semua status",
                value: statusFilter,
              },
            ]}
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari ujian..."
            searchValue={search}
          />
        }
        description={
          <>
            Total: <strong>{exams.length}</strong> ujian
          </>
        }
        title="Daftar Ujian"
      >
        <DataTable
          actions={(row) => (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/exams/${row.id}`}>
                  <Eye className="h-4 w-4" /> Lihat
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/exams/${row.id}/edit`}>
                  <Edit3 className="h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button onClick={() => setPendingDelete(row.id)} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={exams}
          emptyState={{ title: "Belum ada ujian", description: "Buat ujian pertama untuk memulai." }}
          getRowId={(row) => row.id}
          loading={loading}
          minWidth="min-w-[720px]"
        />
      </SectionCard>

      <ConfirmDialog
        description="Hapus ujian ini? Semua data terkait juga akan dihapus."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus"
      />
    </div>
  );
}
