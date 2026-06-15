"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, Loader2, Plus, Printer, RefreshCcw, Save, Search } from "lucide-react";

import type { AttendanceSessionDetail, AttendanceSessionRecord } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, FormModal, Input, PageHeader } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";

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

  return (
    <div className="space-y-8">
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

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Sesi Presensi</CardTitle>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total: {total} sesi</p>
            </div>
            <form className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center" onSubmit={handleSearch}>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari mapel, topik..."
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
          ) : sessions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Mapel</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Jam</th>
                    <th className="px-4 py-3 font-semibold">Records</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr className="border-b last:border-0" key={session.id}>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {new Date(session.date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {session.schedule?.teachingAssignment?.subject?.name ?? "-"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">
                        {session.schedule?.teachingAssignment?.classroom?.name ?? "-"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-muted-foreground">{session.schedule?.lessonHour?.name ?? "-"}</td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary">{session._count?.records ?? 0}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => openSessionDetail(session.id)} size="sm" variant="outline">
                            <Eye className="h-4 w-4" /> Detail
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
                <Button onClick={() => setFormOpen(true)} variant="soft">
                  Buat sesi pertama
                </Button>
              }
              description="Belum ada sesi presensi."
              title="Data masih kosong"
            />
          )}
        </CardContent>
      </Card>

      <FormModal hideOverlay onClose={() => setRecapOpen(false)} open={recapOpen} title="Cetak Rekap Presensi">
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleDownloadRecap();
          }}
        >
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kelas</span>
            <EntityPicker
              entityType="classroom"
              onChange={setRecapClassroomId}
              placeholder="Cari kelas..."
              required
              value={recapClassroomId}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tanggal Mulai</span>
            <Input onChange={(e) => setRecapStart(e.target.value)} required type="date" value={recapStart} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tanggal Akhir</span>
            <Input onChange={(e) => setRecapEnd(e.target.value)} required type="date" value={recapEnd} />
          </label>
          <div className="md:col-span-3 flex justify-end gap-2">
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

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Buat Sesi Presensi Baru">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSession}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Jadwal</span>
            <EntityPicker entityType="schedule" name="scheduleId" placeholder="Cari jadwal..." required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tanggal</span>
            <Input name="date" required type="date" />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Buat Sesi
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>

      {sessionDetailLoading ? (
        <Card>
          <CardContent>
            <div className="grid min-h-32 place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : selectedSession ? (
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>
                  Detail Presensi - {selectedSession.schedule?.teachingAssignment?.subject?.name ?? "Mapel"} /{" "}
                  {selectedSession.schedule?.teachingAssignment?.classroom?.name ?? "Kelas"}
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {new Date(selectedSession.date).toLocaleDateString("id-ID")} &middot; {selectedSession.schedule?.lessonHour?.name ?? ""}{" "}
                  &middot; Guru: {selectedSession.schedule?.teachingAssignment?.teacher?.name ?? ""}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total: {selectedSession.records.length} siswa
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveRecords} disabled={savingRecords}>
                  {savingRecords ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Presensi
                </Button>
                <Button onClick={() => setSelectedSession(null)} variant="outline">
                  Tutup
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                          className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-semibold shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
              <Button onClick={handleSaveRecords} disabled={savingRecords}>
                {savingRecords ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Simpan Semua
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
