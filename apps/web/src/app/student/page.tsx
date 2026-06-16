"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ClipboardCheck, GraduationCap, Megaphone, School, Wallet } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, LoadingState, SectionCard, StatCard } from "@nexsmsid/ui";

import { PortalDashboardHero } from "@/components/portal/portal-dashboard-hero";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Dashboard = {
  student: {
    classroom: { code: string; id: string; name: string } | null;
    competency: string | null;
    id: string;
    name: string;
    nis: string;
    nisn: string | null;
    photoUrl?: string | null;
  };
  counts: {
    attendanceBreakdown: Record<string, number>;
    attendancePercent: number;
    averageScore: number;
    pendingGradeCount: number;
    totalSessionsThisMonth: number;
    unpaidAmount: number;
    unpaidInvoices: number;
    unreadNotifications: number;
  };
  todaySchedules: ScheduleItem[];
  recentAnnouncements: Announcement[];
};

type ScheduleItem = {
  id: string;
  lessonHour?: { endTime: string; name: string; startTime: string } | null;
  room?: { name: string } | null;
  teachingAssignment?: { subject?: { name: string } | null; teacher?: { name: string } | null } | null;
};

type Announcement = { content: string; id: string; publishedAt: string | null; title: string };
type Notification = { body: string; createdAt: string; id: string; status: string; title: string };

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { currency: "IDR", maximumFractionDigits: 0, style: "currency" }).format(value ?? 0);

export default function StudentDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadDashboard = useCallback(async () => {
    const [dashboard, notifications] = await Promise.all([
      api.getStudentPortalDashboard() as Promise<Dashboard>,
      api.getStudentPortalNotifications({ limit: 5 }) as Promise<Notification[]>,
    ]);
    return { dashboard, notifications };
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery(loadDashboard, [api]);
  const dashboard = data?.dashboard ?? null;
  const notifications = data?.notifications ?? [];

  if (loading) return <LoadingState label="Memuat dashboard siswa..." minHeight="min-h-[60vh]" />;
  if (error || !dashboard)
    return <ErrorState message={error ?? "Data dashboard tidak tersedia"} onRetry={() => void refetch()} title="Gagal memuat dashboard" />;

  const hadir = (dashboard.counts.attendanceBreakdown.PRESENT ?? 0) + (dashboard.counts.attendanceBreakdown.LATE ?? 0);

  return (
    <div className="space-y-6">
      <PortalDashboardHero
        description={`Halo ${dashboard.student.name}. Pantau jadwal, kehadiran, nilai, dan tagihan Anda di sini.`}
        eyebrow="Portal Siswa"
        onRefresh={() => void refetch()}
        title="Dashboard Siswa"
      />

      <SectionCard title="Profil Singkat">
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <Info label="Nama" value={dashboard.student.name} />
          <Info label="NIS / NISN" value={`${dashboard.student.nis} / ${dashboard.student.nisn ?? "-"}`} />
          <Info label="Kelas" value={dashboard.student.classroom?.name ?? "-"} />
          <Info label="Kompetensi" value={dashboard.student.competency ?? "-"} />
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          title="Kehadiran"
          tone="emerald"
          value={`${dashboard.counts.attendancePercent}%`}
          description={`${hadir}/${dashboard.counts.totalSessionsThisMonth} sesi bulan ini`}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Rata-rata Nilai"
          tone="violet"
          value={String(dashboard.counts.averageScore || 0)}
          description={`${dashboard.counts.pendingGradeCount} nilai pending`}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          title="Tagihan Belum Lunas"
          tone="amber"
          value={formatRupiah(dashboard.counts.unpaidAmount)}
          description={`${dashboard.counts.unpaidInvoices} invoice`}
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          title="Notifikasi Unread"
          tone="blue"
          value={String(dashboard.counts.unreadNotifications)}
        />
      </div>

      <SectionCard description="Akses cepat data akademik dan tagihan." title="Quick Action">
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="soft">
            <Link href="/student/schedules">
              <CalendarDays className="h-4 w-4" /> Lihat Jadwal
            </Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/student/grades">
              <GraduationCap className="h-4 w-4" /> Lihat Nilai
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/student/invoices">
              <Wallet className="h-4 w-4" /> Lihat Tagihan
            </Link>
          </Button>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard description="Jadwal pelajaran hari ini." title="Jadwal Hari Ini">
          {dashboard.todaySchedules.length === 0 ? (
            <EmptyState description="Tidak ada jadwal pelajaran hari ini." title="Tidak ada jadwal" />
          ) : (
            <ul className="space-y-3">
              {dashboard.todaySchedules.map((item) => (
                <li className="dashboard-insight-row" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <School className="h-4 w-4 text-primary" /> {item.teachingAssignment?.subject?.name ?? "Mata pelajaran"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.teachingAssignment?.teacher?.name ?? "Guru"} - {item.room?.name ?? "Ruang"}
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
          <div className="space-y-3">
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
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
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
  if (!items.length) return <EmptyState description="Belum ada informasi terbaru." title="Tidak ada data" />;
  const Icon = icon === "announcement" ? Megaphone : Bell;
  return (
    <ul className="space-y-2">
      {items.slice(0, 3).map((item) => (
        <li className="dashboard-insight-row p-3" key={item.id}>
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
