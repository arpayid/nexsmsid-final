"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { AttendanceSessionDetail } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ErrorState, PageHeader } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Hadir" },
  { value: "SICK", label: "Sakit" },
  { value: "PERMIT", label: "Izin" },
  { value: "ABSENT", label: "Alpa" },
  { value: "LATE", label: "Terlambat" },
];

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>
              {session.schedule.teachingAssignment.subject.name} • {session.schedule.teachingAssignment.classroom.name}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(session.date).toLocaleDateString("id-ID")} • {session.schedule.lessonHour.startTime}–
              {session.schedule.lessonHour.endTime}
            </p>
          </div>
          <Badge variant="secondary">{session.records.length} siswa</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {session.records.map((record) => (
                  <tr className="border-b" key={record.studentId}>
                    <td className="px-3 py-3 font-medium">{record.student?.name ?? record.studentId}</td>
                    <td className="px-3 py-3">
                      <select
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                        onChange={(event) => setStatusOverrides((prev) => ({ ...prev, [record.studentId]: event.target.value }))}
                        value={statusOverrides[record.studentId] ?? record.status}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Presensi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
