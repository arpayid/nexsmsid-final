"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { AttendanceSessionDetail } from "@nexsmsid/api-client";
import { Badge, Button, DataTable, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Hadir" },
  { value: "SICK", label: "Sakit" },
  { value: "PERMIT", label: "Izin" },
  { value: "ABSENT", label: "Alpa" },
  { value: "LATE", label: "Terlambat" },
];

type RecordRow = AttendanceSessionDetail["records"][number];

export default function TeacherAttendanceDetailPage() {
  const params = useParams<{ id: string }>();
  const api = useMemo(() => createBrowserApiClient(), []);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSession = useCallback(() => api.getAttendanceSession(params.id), [api, params.id]);
  const { data: session, error: fetchError, loading, refetch } = useApiQuery<AttendanceSessionDetail>(loadSession, [api, params.id]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    setActionError(null);
    try {
      const records = session.records.map((record) => ({
        studentId: record.studentId,
        status: statusOverrides[record.studentId] ?? record.status,
        note: "",
      }));
      await api.recordAttendance(session.id, { records });
      setStatusOverrides({});
      await refetch();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Gagal menyimpan presensi");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<DataTableColumn<RecordRow>[]>(
    () => [
      {
        header: "Siswa",
        key: "student",
        cell: (row) => row.student?.name ?? row.studentId,
      },
      {
        header: "Status",
        key: "status",
        cell: (row) => (
          <select
            className="h-10 w-full min-w-[140px] rounded-lg border border-border bg-card px-3 text-sm"
            onChange={(event) => setStatusOverrides((prev) => ({ ...prev, [row.studentId]: event.target.value }))}
            value={statusOverrides[row.studentId] ?? row.status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [statusOverrides],
  );

  const error = actionError ?? fetchError;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !session) return <ErrorState message={error} title="Gagal memuat presensi" />;
  if (!session) return <ErrorState message="Sesi tidak ditemukan" title="Tidak ditemukan" />;

  const sessionTitle = `${session.schedule.teachingAssignment.subject.name} • ${session.schedule.teachingAssignment.classroom.name}`;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/attendance">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
        breadcrumb={["Portal Guru", "Presensi", "Detail Sesi"]}
        description="Input kehadiran siswa untuk sesi ini."
        eyebrow="Portal Guru"
        title="Input Presensi"
      />

      {actionError ? <ErrorState message={actionError} title="Terjadi kesalahan" /> : null}

      <SectionCard
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{session.records.length} siswa</Badge>
            <Button disabled={saving} onClick={() => void handleSave()} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Presensi
            </Button>
          </div>
        }
        description={`${new Date(session.date).toLocaleDateString("id-ID")} • ${session.schedule.lessonHour.startTime}–${session.schedule.lessonHour.endTime}`}
        title={sessionTitle}
      >
        <DataTable columns={columns} data={session.records} getRowId={(row) => row.studentId} minWidth="min-w-[520px]" />
      </SectionCard>
    </div>
  );
}
