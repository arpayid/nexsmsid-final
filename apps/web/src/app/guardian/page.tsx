"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ClipboardCheck, GraduationCap, Megaphone, UserRound, Users, Wallet } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, LoadingState, SectionCard, StatCard } from "@nexsmsid/ui";

import { ChildSelector } from "@/components/child-selector";
import { PortalDashboardHero } from "@/components/portal/portal-dashboard-hero";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Dashboard = {
  guardian: { email: string | null; id: string; name: string; phone: string | null };
  counts: { children: number; totalOutstanding: number; unreadNotifications: number };
  children: ChildSummary[];
  recentAnnouncements: Announcement[];
};

type ChildSummary = {
  attendanceBreakdown: Record<string, number>;
  attendancePercent: number;
  averageScore: number;
  classroom: string | null;
  competency: string | null;
  id: string;
  name: string;
  nis: string;
  outstandingAmount: number;
  outstandingInvoices: number;
  photoUrl?: string | null;
  todaySchedules: ScheduleItem[];
  totalSessionsThisMonth: number;
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

export default function GuardianDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const [dashboard, notifications] = await Promise.all([
      api.getGuardianPortalDashboard() as Promise<Dashboard>,
      api.getGuardianPortalNotifications({ limit: 5 }) as Promise<Notification[]>,
    ]);
    return { dashboard, notifications };
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery(loadDashboard, [api]);
  const dashboard = data?.dashboard ?? null;
  const notifications = data?.notifications ?? [];
  const resolvedChildId = selectedChildId ?? dashboard?.children[0]?.id ?? null;

  if (loading) return <LoadingState label="Memuat dashboard wali..." minHeight="min-h-[60vh]" />;
  if (error || !dashboard)
    return <ErrorState message={error ?? "Data dashboard tidak tersedia"} onRetry={() => void refetch()} title="Gagal memuat dashboard" />;

  const child = dashboard.children.find((c) => c.id === resolvedChildId) ?? dashboard.children[0] ?? null;

  return (
    <div className="space-y-6">
      <PortalDashboardHero
        description={`Halo ${dashboard.guardian.name}. Pantau data anak yang terhubung dengan akun wali Anda.`}
        eyebrow="Portal Wali"
        onRefresh={() => void refetch()}
        title="Dashboard Wali"
      />

      <SectionCard description="Pilih anak untuk melihat ringkasan detail." title="Child Selector">
        <ChildSelector onChange={setSelectedChildId} />
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} title="Jumlah Anak" tone="violet" value={String(dashboard.counts.children)} />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          title="Total Tagihan Anak"
          tone="amber"
          value={formatRupiah(dashboard.counts.totalOutstanding)}
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          title="Notifikasi Unread"
          tone="blue"
          value={String(dashboard.counts.unreadNotifications)}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Jadwal Hari Ini"
          tone="emerald"
          value={String(child?.todaySchedules.length ?? 0)}
        />
      </div>

      {child ? (
        <>
          <SectionCard description="Ringkasan anak terpilih." title="Ringkasan Anak">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ChildInfo icon={<UserRound className="h-4 w-4" />} label="Nama" value={`${child.name} (${child.nis})`} />
              <ChildInfo icon={<Users className="h-4 w-4" />} label="Kelas" value={child.classroom ?? "-"} />
              <ChildInfo icon={<GraduationCap className="h-4 w-4" />} label="Kompetensi" value={child.competency ?? "-"} />
              <ChildInfo icon={<Wallet className="h-4 w-4" />} label="Tagihan" value={formatRupiah(child.outstandingAmount)} />
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Kehadiran Anak"
              tone="emerald"
              value={`${child.attendancePercent}%`}
              description={`${child.totalSessionsThisMonth} sesi bulan ini`}
            />
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              title="Nilai Anak"
              tone="violet"
              value={String(child.averageScore || 0)}
            />
            <StatCard
              icon={<Wallet className="h-5 w-5" />}
              title="Tagihan Anak"
              tone="amber"
              value={formatRupiah(child.outstandingAmount)}
              description={`${child.outstandingInvoices} invoice`}
            />
          </div>

          <SectionCard description="Akses cepat data anak terpilih." title="Quick Action">
            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild variant="soft">
                <Link href="/guardian/attendance">
                  <ClipboardCheck className="h-4 w-4" /> Lihat Absensi
                </Link>
              </Button>
              <Button asChild variant="soft">
                <Link href="/guardian/grades">
                  <GraduationCap className="h-4 w-4" /> Lihat Nilai
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/guardian/invoices">
                  <Wallet className="h-4 w-4" /> Lihat Tagihan
                </Link>
              </Button>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <SectionCard description="Jadwal anak terpilih hari ini." title="Jadwal Anak Hari Ini">
              {child.todaySchedules.length === 0 ? (
                <EmptyState description="Tidak ada jadwal hari ini." title="Tidak ada jadwal" />
              ) : (
                <ul className="space-y-3">
                  {child.todaySchedules.map((item) => (
                    <li className="dashboard-insight-row" key={item.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.teachingAssignment?.subject?.name ?? "Mata pelajaran"}</p>
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
        </>
      ) : (
        <EmptyState description="Belum ada anak yang terhubung dengan akun wali ini." title="Tidak ada anak" />
      )}
    </div>
  );
}

function ChildInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="dashboard-mini-metric">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
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
