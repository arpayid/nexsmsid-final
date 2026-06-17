"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle2, Eye, Loader2, Plus, Printer, RefreshCcw, Save } from "lucide-react";

import type { AttendanceSessionDetail, AttendanceSessionRecord } from "@nexsmsid/api-client";
import { Badge, Button, DataTable, ErrorState, FormModal, Input, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Hadir" },
  { value: "SICK", label: "Sakit" },
  { value: "PERMIT", label: "Izin" },
  { value: "ABSENT", label: "Alpa" },
  { value: "LATE", label: "Terlambat" },
];

const statusBadge: Record<string, "success" | "warning" | "info" | "outline" | "secondary"> = {
  PRESENT: "success",
  SICK: "warning",
  PERMIT: "info",
  ABSENT: "outline",
  LATE: "secondary",
};

export default function AttendancePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(
    () => api.listAttendanceSessions({ limit: 50, page: 1, search: appliedSearch || undefined }),
    [api, appliedSearch],
  );
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const sessions = data?.items ?? [];
  const total = data?.meta?.total ?? sessions.length;
  const error = actionError ?? fetchError;

  const [selectedSession, setSelectedSession] = useState<AttendanceSessionDetail | null>(null);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [savingRecords, setSavingRecords] = useState(false);

  const [recapOpen, setRecapOpen] = useState(false);
  const [recapClassroomId, setRecapClassroomId] = useState<string>("");
  const [recapStart, setRecapStart] = useState<string>("");
  const [recapEnd, setRecapEnd] = useState<string>("");
  const [recapBusy, setRecapBusy] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  async function handleDownloadRecap() {
    if (!recapClassroomId) {
      setActionError("Pilih kelas terlebih dahulu");
      return;
    }
    if (!recapStart || !recapEnd) {
      setActionError("Isi tanggal mulai dan tanggal akhir");
      return;
    }
    setActionError(null);
    setRecapBusy(true);
    try {
      const blob = await api.downloadAttendanceRecapPdf(recapClassroomId, { startDate: recapStart, endDate: recapEnd });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setRecapOpen(false);
    } catch (recapError) {
      setActionError(recapError instanceof Error ? recapError.message : "Gagal membuat rekap presensi");
    } finally {
      setRecapBusy(false);
    }
  }

  async function openSessionDetail(id: string) {
    setSessionDetailLoading(true);
    setActionError(null);
    try {
      const session = await api.getAttendanceSession(id);
      setSelectedSession(session);
      const statuses: Record<string, string> = {};
      for (const record of session.records) {
        statuses[record.studentId] = record.status;
      }
      setStudentStatuses(statuses);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memuat detail presensi");
    } finally {
      setSessionDetailLoading(false);
    }
  }

  async function handleSaveRecords() {
    if (!selectedSession) return;
    setSavingRecords(true);
    setActionError(null);
    try {
      const records = Object.entries(studentStatuses).map(([studentId, status]) => ({ studentId, status, note: "" }));
      await api.recordAttendance(selectedSession.id, { records });
      await openSessionDetail(selectedSession.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan presensi");
    } finally {
      setSavingRecords(false);
    }
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      scheduleId: formData.get("scheduleId"),
      date: formData.get("date"),
    };
    try {
      const session = await api.createAttendanceSession(payload);
      setFormOpen(false);
      await refetch();
      await openSessionDetail(session.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membuat sesi presensi");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<AttendanceSessionRecord>[] = [
    {
      cell: (session) => new Date(session.date).toLocaleDateString("id-ID"),
      header: "Tanggal",
      key: "date",
    },
    {
      cell: (session) => session.schedule?.teachingAssignment?.subject?.name ?? "-",
      header: "Mapel",
      key: "subject",
    },
    {
      cell: (session) => session.schedule?.teachingAssignment?.classroom?.name ?? "-",
      header: "Kelas",
      key: "classroom",
    },
    {
      cell: (session) => session.schedule?.lessonHour?.name ?? "-",
      header: "Jam",
      key: "lessonHour",
    },
    {
      cell: (session) => <Badge variant="secondary">{session._count?.records ?? 0}</Badge>,
      header: "Records",
      key: "records",
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
            <Button onClick={() => setRecapOpen(true)} variant="soft">
              <Printer className="h-4 w-4" /> Cetak Rekap
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Sesi Baru
            </Button>
          </>
        }
        breadcrumb={["Admin", "Akademik", "Presensi"]}
        description="Kelola presensi siswa per sesi pertemuan."
        eyebrow="Akademik"
        title="Presensi Siswa"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses presensi" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari mapel, topik..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar sesi presensi harian. Total: <strong>{total}</strong> sesi.
          </>
        }
        title="Sesi Presensi"
      >
        <DataTable
          actions={(session) => (
            <Button onClick={() => openSessionDetail(session.id)} size="sm" variant="outline">
              <Eye className="h-4 w-4" /> Detail
            </Button>
          )}
          columns={columns}
          data={sessions}
          emptyState={{
            action: (
              <Button onClick={() => setFormOpen(true)} variant="soft">
                Buat sesi pertama
              </Button>
            ),
            description: "Belum ada sesi presensi atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(session) => session.id}
          loading={loading}
          minWidth="min-w-[650px]"
        />
      </SectionCard>

      <FormModal
        description="Pilih kelas dan rentang tanggal untuk rekap PDF."
        onClose={() => setRecapOpen(false)}
        open={recapOpen}
        title="Cetak Rekap Presensi"
      >
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleDownloadRecap();
          }}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kelas</span>
            <EntityPicker
              entityType="classroom"
              onChange={setRecapClassroomId}
              placeholder="Cari kelas..."
              required
              value={recapClassroomId}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal Mulai</span>
            <Input onChange={(e) => setRecapStart(e.target.value)} required type="date" value={recapStart} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal Akhir</span>
            <Input onChange={(e) => setRecapEnd(e.target.value)} required type="date" value={recapEnd} />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setRecapOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={recapBusy} type="submit">
              {recapBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak PDF
            </Button>
          </div>
        </form>
      </FormModal>

      <FormModal
        description="Pilih jadwal dan tanggal pertemuan."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title="Buat Sesi Presensi Baru"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSession}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Jadwal</span>
            <EntityPicker entityType="schedule" name="scheduleId" placeholder="Cari jadwal..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal</span>
            <Input name="date" required type="date" />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Buat Sesi
            </Button>
          </div>
        </form>
      </FormModal>

      {sessionDetailLoading ? (
        <SectionCard description="Memuat data presensi siswa..." title="Detail Presensi">
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : selectedSession ? (
        <SectionCard
          action={
            <div className="flex flex-wrap gap-2">
              <Button disabled={savingRecords} onClick={() => void handleSaveRecords()}>
                {savingRecords ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Presensi
              </Button>
              <Button onClick={() => setSelectedSession(null)} variant="outline">
                Tutup
              </Button>
            </div>
          }
          description={
            <>
              {new Date(selectedSession.date).toLocaleDateString("id-ID")} · {selectedSession.schedule?.lessonHour?.name ?? ""} · Guru:{" "}
              {selectedSession.schedule?.teachingAssignment?.teacher?.name ?? ""} · Total: <strong>{selectedSession.records.length}</strong>{" "}
              siswa
            </>
          }
          title={`Detail Presensi — ${selectedSession.schedule?.teachingAssignment?.subject?.name ?? "Mapel"} / ${selectedSession.schedule?.teachingAssignment?.classroom?.name ?? "Kelas"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">NIS</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedSession.records.map((record) => (
                  <tr className="border-b last:border-0" key={record.studentId}>
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-muted-foreground">{record.student.nis}</td>
                    <td className="px-4 py-4 font-semibold text-muted-foreground">{record.student.name}</td>
                    <td className="px-4 py-4">
                      <select
                        className="rounded-xl border border-input bg-card px-3 py-1.5 text-sm font-semibold shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={studentStatuses[record.studentId] ?? "PRESENT"}
                        onChange={(e) => setStudentStatuses((prev) => ({ ...prev, [record.studentId]: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <Badge className="ml-2" variant={statusBadge[studentStatuses[record.studentId] ?? "PRESENT"]}>
                        {STATUS_OPTIONS.find((o) => o.value === (studentStatuses[record.studentId] ?? "PRESENT"))?.label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            <Button disabled={savingRecords} onClick={() => void handleSaveRecords()}>
              {savingRecords ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Simpan Semua
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
