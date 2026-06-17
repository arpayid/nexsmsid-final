"use client";

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import type { ExamScheduleRecord } from "@nexsmsid/api-client";
import { Button, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ScheduleFormPayload = Record<string, string>;

export default function ExamSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const loadSchedules = useCallback(() => client.listExamSchedules(id), [client, id]);
  const { data, error, loading, refetch, setError } = useApiQuery<ExamScheduleRecord[]>(loadSchedules, [client, id]);
  const schedules = (data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      String(row.room?.name ?? "")
        .toLowerCase()
        .includes(needle) || String(row.date ?? "").includes(needle)
    );
  });

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload: ScheduleFormPayload = {};
    for (const [key, value] of form.entries()) {
      payload[key] = String(value);
    }
    try {
      await client.createExamSchedule(id, payload);
      setShowForm(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat jadwal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(scheduleId: string) {
    try {
      await client.deleteExamSchedule(scheduleId);
      await refetch();
    } catch {
      setError("Gagal menghapus jadwal");
    }
  }

  const columns: DataTableColumn<ExamScheduleRecord>[] = [
    { header: "Tanggal", key: "date", cell: (row) => new Date(row.date).toLocaleDateString("id-ID") },
    { header: "Mulai", key: "startTime" },
    { header: "Selesai", key: "endTime" },
    { header: "Ruangan", key: "room", cell: (row) => row.room?.name ?? "-" },
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
        breadcrumb={["Admin", "Ujian / CBT", "Jadwal"]}
        description="Kelola jadwal pelaksanaan ujian."
        title="Jadwal Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4" /> Tambah Jadwal
      </Button>

      {showForm ? (
        <SectionCard title="Tambah Jadwal">
          <form className="max-w-lg space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Tanggal</span>
                <input
                  className="w-full h-11 rounded-lg border border-input bg-card px-4 text-sm shadow-sm outline-none"
                  name="date"
                  type="date"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Ruangan</span>
                <EntityPicker entityType="exam-room" name="roomId" placeholder="Cari ruangan ujian..." />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Mulai</span>
                <input
                  className="w-full h-11 rounded-lg border border-input bg-card px-4 text-sm shadow-sm outline-none"
                  name="startTime"
                  type="time"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-muted-foreground">Selesai</span>
                <input
                  className="w-full h-11 rounded-lg border border-input bg-card px-4 text-sm shadow-sm outline-none"
                  name="endTime"
                  type="time"
                  required
                />
              </label>
            </div>
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
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari jadwal..." searchValue={search} />
        }
        description={
          <>
            Total: <strong>{schedules.length}</strong> jadwal
          </>
        }
        title="Daftar Jadwal"
      >
        <DataTable
          actions={(row) => (
            <Button onClick={() => handleDelete(row.id)} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          )}
          columns={columns}
          data={schedules}
          emptyState={{ title: "Belum ada jadwal", description: "Tambah jadwal untuk ujian ini." }}
          getRowId={(row) => row.id}
          loading={loading}
        />
      </SectionCard>
    </div>
  );
}
