"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import type { ScheduleRecord } from "@nexsmsid/api-client";
import { Badge, Button, ConfirmDialog, DataTable, ErrorState, FormModal, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const DAYS = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" },
  { value: "SUNDAY", label: "Minggu" },
];

export default function SchedulesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<ScheduleRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ScheduleRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(() => api.listSchedules({ limit: 50, page: 1, search: appliedSearch || undefined }), [api, appliedSearch]);
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const items = data?.data ?? [];
  const total = (data?.meta as { total?: number } | undefined)?.total ?? items.length;
  const error = actionError ?? fetchError;

  const dayLabel = useCallback((day: string) => DAYS.find((d) => d.value === day)?.label ?? day, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: ScheduleRecord) {
    setEditing(item);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteSchedule(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus data");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      teachingAssignmentId: formData.get("teachingAssignmentId"),
      roomId: formData.get("roomId"),
      lessonHourId: formData.get("lessonHourId"),
      dayOfWeek: formData.get("dayOfWeek"),
    };
    try {
      if (editing) {
        await api.updateSchedule(editing.id, payload);
      } else {
        await api.createSchedule(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<ScheduleRecord>[] = [
    {
      cell: (item) => <Badge variant="info">{dayLabel(item.dayOfWeek)}</Badge>,
      header: "Hari",
      key: "dayOfWeek",
    },
    {
      cell: (item) => item.lessonHour?.name ?? "-",
      header: "Jam",
      key: "lessonHour",
    },
    {
      cell: (item) => item.teachingAssignment?.teacher?.name ?? "-",
      header: "Guru",
      key: "teacher",
    },
    {
      cell: (item) => item.teachingAssignment?.subject?.name ?? "-",
      header: "Mapel",
      key: "subject",
    },
    {
      cell: (item) => item.teachingAssignment?.classroom?.name ?? "-",
      header: "Kelas",
      key: "classroom",
    },
    {
      cell: (item) => item.room?.name ?? "-",
      header: "Ruangan",
      key: "room",
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
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Akademik", "Jadwal"]}
        description="Atur jadwal pelajaran per hari, jam, guru, dan ruangan."
        eyebrow="Akademik"
        title="Jadwal Pelajaran"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses jadwal" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari mapel, guru, kelas..."
            searchValue={search}
          />
        }
        description={
          <>
            Kelola jadwal pelajaran harian. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Jadwal"
      >
        <DataTable
          actions={(item) => (
            <>
              <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => setPendingDelete(item)} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah jadwal pertama
              </Button>
            ),
            description: "Belum ada jadwal atau hasil pencarian kosong.",
            title: "Data jadwal kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[820px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi penugasan mengajar, hari, jam, dan ruangan."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={`${editing ? "Edit" : "Tambah"} Jadwal`}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Penugasan Mengajar</span>
            <EntityPicker
              defaultValue={editing?.teachingAssignmentId ?? ""}
              entityType="teaching-assignment"
              name="teachingAssignmentId"
              placeholder="Cari guru — mapel — kelas..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Hari</span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={editing?.dayOfWeek ?? ""}
              name="dayOfWeek"
              required
            >
              <option value="" disabled>
                Pilih Hari
              </option>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Jam Pelajaran</span>
            <EntityPicker
              defaultValue={editing?.lessonHourId ?? ""}
              entityType="lesson-hour"
              name="lessonHourId"
              placeholder="Cari jam pelajaran..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Ruangan</span>
            <EntityPicker defaultValue={editing?.roomId ?? ""} entityType="room" name="roomId" placeholder="Cari ruangan..." required />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        description={`Hapus jadwal ${pendingDelete ? dayLabel(pendingDelete.dayOfWeek) : ""} — ${pendingDelete?.teachingAssignment?.subject?.name ?? ""}?`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus jadwal"
      />
    </div>
  );
}
