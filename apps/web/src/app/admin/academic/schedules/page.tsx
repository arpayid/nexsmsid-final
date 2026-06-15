"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, Edit3, Loader2, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";

import type { ScheduleRecord } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader } from "@nexsmsid/ui";

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

  async function handleDelete(item: ScheduleRecord) {
    const confirmed = window.confirm(`Hapus jadwal ${item.dayOfWeek} - ${item.teachingAssignment?.subject?.name ?? ""}?`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await api.deleteSchedule(item.id);
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

  const dayLabel = (day: string) => DAYS.find((d) => d.value === day)?.label ?? day;

  return (
    <div className="space-y-8">
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

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Data Jadwal</CardTitle>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total: {total} data</p>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari mapel, guru, kelas..."
                  value={search}
                />
              </div>
              <Button type="submit" variant="soft">
                Cari
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat data...
              </span>
            </div>
          ) : items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Hari</th>
                    <th className="px-4 py-3 font-semibold">Jam</th>
                    <th className="px-4 py-3 font-semibold">Guru</th>
                    <th className="px-4 py-3 font-semibold">Mapel</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Ruangan</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-4 py-4">
                        <Badge variant="info">{dayLabel(item.dayOfWeek)}</Badge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.lessonHour?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.teachingAssignment?.teacher?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.teachingAssignment?.subject?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.teachingAssignment?.classroom?.name ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{item.room?.name ?? "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                            <Edit3 className="h-4 w-4" /> Edit
                          </Button>
                          <Button onClick={() => handleDelete(item)} size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" /> Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={openCreate} variant="soft">
                  Tambah jadwal pertama
                </Button>
              }
              description="Belum ada jadwal."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title={`${editing ? "Edit" : "Tambah"} Jadwal`}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Penugasan Mengajar</span>
            <EntityPicker
              defaultValue={editing?.teachingAssignmentId ?? ""}
              entityType="teaching-assignment"
              name="teachingAssignmentId"
              placeholder="Cari guru — mapel — kelas..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Hari</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
            <span className="text-sm font-bold text-muted-foreground">Jam Pelajaran</span>
            <EntityPicker
              defaultValue={editing?.lessonHourId ?? ""}
              entityType="lesson-hour"
              name="lessonHourId"
              placeholder="Cari jam pelajaran..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Ruangan</span>
            <EntityPicker defaultValue={editing?.roomId ?? ""} entityType="room" name="roomId" placeholder="Cari ruangan..." required />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
