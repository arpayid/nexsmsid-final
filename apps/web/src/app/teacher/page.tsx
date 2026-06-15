"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Bell, BookOpenCheck, CalendarDays, ClipboardCheck, GraduationCap, Megaphone, RefreshCcw, Users } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Dashboard = {
  teacher: { email: string | null; id: string; name: string; nip: string | null; photoUrl?: string | null };
  counts: {
    classrooms: number;
    pendingAttendance: number;
    pendingGrades: number;
    subjects: number;
    teachingAssignments: number;
    todaySchedules: number;
    unreadNotifications: number;
  };
  todaySchedules: ScheduleItem[];
  pendingAttendance: AttendanceSession[];
  pendingAssessments: PendingAssessment[];
  recentAnnouncements: Announcement[];
};

type ScheduleItem = {
  id: string;
  lessonHour?: { endTime: string; name: string; startTime: string } | null;
  room?: { name: string } | null;
  teachingAssignment?: {
    classroom?: { name: string; competency?: { name: string } | null } | null;
    subject?: { name: string } | null;
  } | null;
};

type AttendanceSession = {
  id: string;
  date: string;
  schedule?: { teachingAssignment?: { classroom?: { name: string } | null; subject?: { name: string } | null } | null } | null;
  _count?: { records: number };
};

type PendingAssessment = {
  classroom: string | null;
  gradesCount: number;
  id: string;
  maxScore: number;
  name: string;
  subject: string | null;
  type: string;
};
type Announcement = { content: string; id: string; publishedAt: string | null; title: string };
type Notification = { body: string; createdAt: string; id: string; status: string; title: string };

export default function TeacherDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadDashboard = useCallback(async () => {
    const [dashboard, notifications] = await Promise.all([
      api.getTeacherPortalDashboard() as Promise<Dashboard>,
      api.getTeacherPortalRecentNotifications() as Promise<Notification[]>,
    ]);
    return { dashboard, notifications };
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery(loadDashboard, [api]);
  const dashboard = data?.dashboard ?? null;
  const notifications = data?.notifications ?? [];

  if (loading) return <LoadingState label="Memuat dashboard guru..." minHeight="min-h-[60vh]" />;
  if (error || !dashboard) {
    return <ErrorState message={error ?? "Data dashboard tidak tersedia"} onRetry={() => void refetch()} title="Gagal memuat dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        }
        breadcrumb={["Portal Guru", "Dashboard"]}
        description={`Selamat datang, ${dashboard.teacher.name}. Dashboard ini hanya menampilkan data mengajar Anda.`}
        eyebrow="Portal Guru"
        title="Dashboard Guru"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} title="Kelas Diajar" tone="violet" value={String(dashboard.counts.classrooms)} />
        <StatCard icon={<BookOpenCheck className="h-5 w-5" />} title="Mapel Diajar" tone="blue" value={String(dashboard.counts.subjects)} />
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          title="Absensi Pending"
          tone="amber"
          value={String(dashboard.counts.pendingAttendance)}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Nilai Pending"
          tone="emerald"
          value={String(dashboard.counts.pendingGrades)}
        />
      </div>

      <SectionCard description="Aksi cepat untuk pekerjaan guru harian." title="Quick Action">
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="soft">
            <Link href="/teacher/attendance">
              <ClipboardCheck className="h-4 w-4" /> Input Absensi
            </Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/teacher/grades">
              <GraduationCap className="h-4 w-4" /> Input Nilai
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teacher/schedules">
              <CalendarDays className="h-4 w-4" /> Lihat Jadwal
            </Link>
          </Button>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard description="Jadwal mengajar hari ini." title="Jadwal Hari Ini">
          {dashboard.todaySchedules.length === 0 ? (
            <EmptyState description="Tidak ada jadwal mengajar hari ini." title="Tidak ada jadwal" />
          ) : (
            <ul className="space-y-3">
              {dashboard.todaySchedules.map((item) => (
                <li className="rounded-lg border border-border p-4" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.teachingAssignment?.subject?.name ?? "Mata pelajaran"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.teachingAssignment?.classroom?.name ?? "Kelas"} - {item.room?.name ?? "Ruang"}
                      </p>
                    </div>
                    <Badge variant="info">
                      {item.lessonHour?.startTime ?? "--:--"} - {item.lessonHour?.endTime ?? "--:--"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard description="Pengumuman dan notifikasi terbaru." title="Info Terbaru">
          <div className="space-y-4">
            <InfoList
              icon="announcement"
              items={dashboard.recentAnnouncements.map((a) => ({ id: a.id, title: a.title, body: a.content, date: a.publishedAt }))}
            />
            <InfoList
              icon="notification"
              items={notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, date: n.createdAt }))}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard description="Sesi presensi tanpa record bulan ini." title="Absensi Pending">
          {dashboard.pendingAttendance.length === 0 ? (
            <EmptyState description="Tidak ada sesi presensi pending." title="Semua beres" />
          ) : (
            <ul className="divide-y divide-border">
              {dashboard.pendingAttendance.slice(0, 5).map((session) => (
                <li className="flex items-center justify-between gap-3 py-3" key={session.id}>
                  <Link className="min-w-0 flex-1" href={`/teacher/attendance/${session.id}`}>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{session.schedule?.teachingAssignment?.subject?.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.schedule?.teachingAssignment?.classroom?.name ?? "-"} -{" "}
                        {new Date(session.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </Link>
                  <Badge variant="warning">{session._count?.records ?? 0} record</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard description="Penilaian dengan nilai yang perlu dilengkapi." title="Nilai Pending">
          {dashboard.pendingAssessments.length === 0 ? (
            <EmptyState description="Belum ada penilaian pending." title="Tidak ada data" />
          ) : (
            <ul className="divide-y divide-border">
              {dashboard.pendingAssessments.slice(0, 5).map((assessment) => (
                <li className="flex items-center justify-between gap-3 py-3" key={assessment.id}>
                  <Link className="min-w-0 flex-1" href={`/teacher/grades/${assessment.id}`}>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{assessment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {assessment.subject ?? "-"} - {assessment.classroom ?? "-"}
                      </p>
                    </div>
                  </Link>
                  <Badge variant="outline">{assessment.gradesCount} nilai</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function InfoList({
  icon,
  items,
}: {
  icon: "announcement" | "notification";
  items: Array<{ body: string; date: string | null; id: string; title: string }>;
}) {
  if (!items.length) return null;
  const Icon = icon === "announcement" ? Megaphone : Bell;
  return (
    <ul className="space-y-2">
      {items.slice(0, 3).map((item) => (
        <li className="rounded-lg border border-border p-3" key={item.id}>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="h-4 w-4 text-primary" /> {item.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
          {item.date ? (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {new Date(item.date).toLocaleString("id-ID")}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
