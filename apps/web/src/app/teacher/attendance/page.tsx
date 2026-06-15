"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, ClipboardCheck, Loader2 } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type TodaySchedule = {
  id: string;
  dayOfWeek: string;
  teachingAssignment?: {
    subject?: { name: string } | null;
    classroom?: { name: string } | null;
  } | null;
  lessonHour?: { startTime: string; endTime: string; name: string } | null;
  room?: { name: string } | null;
};

type AttendanceSession = {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topic: string | null;
  status?: string;
  teachingAssignment?: {
    subject?: { name: string } | null;
    classroom?: { name: string } | null;
  } | null;
  schedule?: {
    teachingAssignment?: {
      subject?: { name: string } | null;
      classroom?: { name: string } | null;
    } | null;
    lessonHour?: { startTime: string; endTime: string } | null;
  } | null;
  _count?: { records: number };
};

const ATTENDANCE_SESSION_LABEL: Record<string, { label: string }> = {
  DRAFT: { label: "Draft" },
  SUBMITTED: { label: "Dikirim" },
  LOCKED: { label: "Terkunci" },
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TeacherAttendancePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [creatingScheduleId, setCreatingScheduleId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [schedules, sessions] = await Promise.all([
      api.getTeacherPortalTodaySchedules() as Promise<TodaySchedule[]>,
      api.getTeacherPortalAttendanceSessions({ limit: 50 }) as Promise<AttendanceSession[]>,
    ]);
    return { schedules, sessions };
  }, [api]);
  const { data, error: fetchError, loading } = useApiQuery(loadData, [api]);
  const todaySchedules = data?.schedules ?? [];
  const items = data?.sessions ?? [];
  const error = actionError ?? fetchError;

  async function handleCreateSession(scheduleId: string) {
    setCreatingScheduleId(scheduleId);
    setActionError(null);
    try {
      const session = await api.createAttendanceSession({ scheduleId, date: todayIsoDate() });
      router.push(`/teacher/attendance/${session.id}`);
    } catch (createError) {
      setActionError(createError instanceof Error ? createError.message : "Gagal membuat sesi presensi");
      setCreatingScheduleId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && items.length === 0 && todaySchedules.length === 0) {
    return <ErrorState message={error} title="Gagal memuat presensi" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Guru", "Presensi"]}
        description="Buat sesi presensi dari jadwal hari ini, lalu input kehadiran siswa."
        eyebrow="Portal Guru"
        title="Presensi Saya"
      />

      {error ? <ErrorState message={error} title="Terjadi kesalahan" /> : null}

      <SectionCard description="Jadwal mengajar Anda hari ini" title="Jadwal Hari Ini">
        {todaySchedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada jadwal mengajar untuk hari ini.</p>
        ) : (
          <ul className="divide-y divide-border">
            {todaySchedules.map((schedule) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={schedule.id}>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {schedule.teachingAssignment?.subject?.name ?? "-"} • {schedule.teachingAssignment?.classroom?.name ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.lessonHour?.startTime ?? "-"}–{schedule.lessonHour?.endTime ?? "-"}
                    {schedule.room?.name ? ` • ${schedule.room.name}` : ""}
                  </p>
                </div>
                <Button disabled={creatingScheduleId === schedule.id} onClick={() => void handleCreateSession(schedule.id)} size="sm">
                  {creatingScheduleId === schedule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                  Buat Sesi
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {items.length === 0 ? (
        <EmptyState description="Belum ada sesi presensi. Buat dari jadwal hari ini di atas." title="Belum ada sesi" />
      ) : (
        <SectionCard description={`${items.length} sesi terakhir`} title="Sesi Presensi">
          <ul className="divide-y divide-border">
            {items.map((session) => {
              const subject = session.teachingAssignment?.subject?.name ?? session.schedule?.teachingAssignment?.subject?.name ?? "-";
              const classroom = session.teachingAssignment?.classroom?.name ?? session.schedule?.teachingAssignment?.classroom?.name ?? "-";
              const startTime = session.startTime ?? session.schedule?.lessonHour?.startTime ?? "-";
              const endTime = session.endTime ?? session.schedule?.lessonHour?.endTime ?? "-";

              return (
                <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={session.id}>
                  <Link className="min-w-0 flex-1" href={`/teacher/attendance/${session.id}`}>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        {subject} • {classroom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        • {startTime}–{endTime}
                      </p>
                      {session.topic ? <p className="mt-1 text-xs text-muted-foreground">Topik: {session.topic}</p> : null}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{session._count?.records ?? 0} siswa</Badge>
                    {session.status ? <StatusBadge map={ATTENDANCE_SESSION_LABEL} value={session.status} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
