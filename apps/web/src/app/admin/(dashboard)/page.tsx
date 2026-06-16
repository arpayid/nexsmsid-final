"use client";

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Database,
  GraduationCap,
  Landmark,
  Loader2,
  RefreshCcw,
  Server,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, type ReactElement, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  Badge,
  Button,
  ChartCard,
  DataTable,
  EmptyState,
  ErrorState,
  ModuleCard,
  PageHeader,
  SectionCard,
  SkeletonCard,
  StatCard,
  StatusBadge,
} from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Overview = {
  people: { studentsActive: number; teachersActive: number; staffsActive: number; guardians: number };
  academic: { classrooms: number; subjects: number; attendanceSessionsThisWeek: number; assessmentsThisSemester: number };
  finance: {
    invoicesIssued: number;
    verifiedPayments: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    expensesThisMonth: number;
  };
  ppdb: { activePeriods: number; activeRegistrations: number };
  programs: { ongoingInternships: number; publishedJobs: number };
  notifications: { unread: number };
};

type AcademicSummary = {
  attendanceThisWeek: Record<string, number>;
  studentsByGender: Record<string, number>;
  studentsByStatus: Record<string, number>;
};

type FinanceSummary = {
  invoices: { count: number; paid: number; total: number };
  payments: { count: number; total: number };
  expenses: { count: number; total: number };
  outstanding: { amount: number; count: number };
  monthly: Array<{ expense: number; income: number; month: string }>;
};

type PpdbSummary = {
  activePeriods: Array<{ endDate: string; id: string; name: string; quota: number | null; startDate: string }>;
  byStatus: Record<string, number>;
  totalRegistrations: number;
};

type PeopleSummary = {
  guardians: { total: number };
  staffs: { total: number };
  students: { total: number };
  teachers: { total: number };
  usersByRole: Array<{ count: number; role: { id: string; name: string; slug: string } }>;
};

type ActivityFeedItem = {
  action: string;
  actor: { email: string; id: string; name: string } | null;
  createdAt: string;
  entity: string;
  entityId: string | null;
  id: string;
};

type QuickAlerts = {
  attendanceMissing: number;
  lowQuotaPeriods: Array<{ name: string; percent: number; quota: number; registrations: number }>;
  overdueInvoices: {
    count: number;
    items: Array<{ id: string; invoiceNumber: string; outstanding: number; student: { name: string; nis: string } }>;
  };
  ppdbActive: { endDate: string; id: string; name: string } | null;
  rejectedPayments: number;
  unreadNotifications: number;
};

type SystemStatus = {
  api: { status: string; uptime: number; version: string };
  database: { provider: string; status: string };
  redis: { available?: boolean; status: string };
};

type DashboardData = {
  academic: AcademicSummary;
  activity: ActivityFeedItem[];
  alerts: QuickAlerts;
  finance: FinanceSummary;
  overview: Overview;
  people: PeopleSummary;
  ppdb: PpdbSummary;
  system: SystemStatus;
};

const chartColors = ["#14997a", "#0ea5e9", "#10b981", "#f97316", "#ef4444", "#14b8a6", "#64748b"];

export default function AdminDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadDashboard = useCallback(async () => {
    const [overview, academic, finance, ppdb, people, activity, alerts, system] = await Promise.all([
      api.dashboardOverview() as Promise<Overview>,
      api.dashboardAcademicSummary() as Promise<AcademicSummary>,
      api.dashboardFinanceSummary() as Promise<FinanceSummary>,
      api.dashboardPpdbSummary() as Promise<PpdbSummary>,
      api.dashboardPeopleSummary() as Promise<PeopleSummary>,
      api.dashboardActivityFeed() as Promise<ActivityFeedItem[]>,
      api.dashboardQuickAlerts() as Promise<QuickAlerts>,
      api.dashboardSystemStatus() as Promise<SystemStatus>,
    ]);
    return { overview, academic, finance, ppdb, people, activity, alerts, system };
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery<DashboardData>(loadDashboard, [api]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-72 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="grid gap-4 xl:col-span-8 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} />
            ))}
          </div>
          <div className="space-y-4 xl:col-span-4">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        action={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Coba Lagi
          </Button>
        }
        message={error ?? "Data dashboard tidak tersedia"}
        title="Gagal memuat dashboard"
      />
    );
  }

  const ppdbStatusData = Object.entries(data.ppdb.byStatus).map(([status, count]) => ({ status, count }));
  const attendanceData = Object.entries(data.academic.attendanceThisWeek).map(([status, count]) => ({ status, count }));
  const peopleData = [
    { label: "Siswa", total: data.people.students.total },
    { label: "Guru", total: data.people.teachers.total },
    { label: "Staff", total: data.people.staffs.total },
    { label: "Wali", total: data.people.guardians.total },
  ];
  const financeMonthly = data.finance.monthly.length ? data.finance.monthly : [{ month: "Belum ada", income: 0, expense: 0 }];

  const modules = buildModules(data.overview);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="soft">
              <Link href="/admin/reports">
                <BarChart3 className="h-4 w-4" /> Laporan
              </Link>
            </Button>
            <Button onClick={() => void refetch()} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
            </Button>
          </>
        }
        breadcrumb={["NexAdmin", "Dashboard"]}
        description="Ringkasan operasional sekolah — akademik, keuangan, PPDB, SDM, dan kesehatan sistem dalam satu tampilan modern."
        eyebrow="Enterprise Dashboard"
        title="Selamat datang di NexAdmin"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={`${formatNumber(data.overview.people.guardians)} wali terdaftar`}
          icon={<UsersRound className="h-5 w-5" />}
          title="Siswa Aktif"
          tone="teal"
          value={formatNumber(data.overview.people.studentsActive)}
        />
        <StatCard
          description={`${formatNumber(data.overview.academic.classrooms)} kelas aktif`}
          icon={<GraduationCap className="h-5 w-5" />}
          title="Guru Aktif"
          tone="blue"
          value={formatNumber(data.overview.people.teachersActive)}
        />
        <StatCard
          description={`${formatNumber(data.overview.finance.outstandingInvoices)} invoice belum lunas`}
          icon={<WalletCards className="h-5 w-5" />}
          title="Tagihan Outstanding"
          tone="amber"
          value={formatCurrency(data.overview.finance.outstandingAmount)}
        />
        <StatCard
          description={`${formatNumber(data.overview.academic.assessmentsThisSemester)} penilaian semester ini`}
          icon={<CalendarCheck className="h-5 w-5" />}
          title="Sesi Presensi Minggu Ini"
          tone="emerald"
          value={formatNumber(data.overview.academic.attendanceSessionsThisWeek)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="grid gap-4 xl:col-span-8 lg:grid-cols-2">
          <ChartCard
            action={<Badge variant="info">PPDB</Badge>}
            description="Distribusi pendaftaran berdasarkan status."
            title="Status Pendaftaran PPDB"
          >
            <ChartFrame>
              <BarChart data={ppdbStatusData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="status" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#14997a" name="Pendaftar" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </ChartCard>

          <ChartCard
            action={<Badge variant="success">Keuangan</Badge>}
            description="Pembayaran terverifikasi vs pengeluaran bulanan."
            title="Arus Kas Bulanan"
          >
            <ChartFrame>
              <AreaChart data={financeMonthly} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickFormatter={(v) => `${Number(v) / 1_000_000}jt`} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Area dataKey="income" fill="#10b98133" name="Masuk" stroke="#10b981" strokeWidth={3} type="monotone" />
                <Area dataKey="expense" fill="#f59e0b33" name="Keluar" stroke="#f59e0b" strokeWidth={3} type="monotone" />
              </AreaChart>
            </ChartFrame>
          </ChartCard>

          <ChartCard
            action={<Badge variant="secondary">Presensi</Badge>}
            description="Rekap status presensi minggu berjalan."
            title="Overview Presensi"
          >
            {attendanceData.length ? (
              <ChartFrame>
                <PieChart>
                  <Pie data={attendanceData} dataKey="count" innerRadius={58} nameKey="status" outerRadius={96} paddingAngle={3}>
                    {attendanceData.map((entry, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={entry.status} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ChartFrame>
            ) : (
              <div className="flex h-72 items-center justify-center px-4">
                <EmptyState description="Belum ada data presensi minggu ini." title="Data kosong" />
              </div>
            )}
          </ChartCard>

          <ChartCard
            action={<Badge variant="outline">SDM</Badge>}
            description="Komposisi siswa, guru, staff, dan wali."
            title="Komposisi People"
          >
            <ChartFrame>
              <BarChart data={peopleData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="#0ea5e9" name="Total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </ChartCard>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <QuickAlertsCard alerts={data.alerts} />
          <SecondaryMetricsCard overview={data.overview} />
          <SystemStatusCard status={data.system} unread={data.overview.notifications.unread} />
        </div>
      </div>

      <SectionCard
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin">
              Semua modul <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
        description="Akses cepat ke modul inti operasional sekolah."
        title="Pintasan Modul"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return <ModuleCard key={module.href} {...module} icon={<Icon className="h-5 w-5" />} />;
          })}
        </div>
      </SectionCard>

      <RecentActivityCard activity={data.activity} />
    </div>
  );
}

function buildModules(overview: Overview) {
  return [
    {
      title: "Siswa",
      description: "Data peserta didik aktif dan relasi kelas.",
      href: "/admin/students",
      icon: UsersRound,
      tone: "teal" as const,
      meta: `${formatNumber(overview.people.studentsActive)} aktif`,
    },
    {
      title: "Guru",
      description: "Profil guru dan penugasan mengajar.",
      href: "/admin/teachers",
      icon: GraduationCap,
      tone: "blue" as const,
      meta: `${formatNumber(overview.people.teachersActive)} aktif`,
    },
    {
      title: "Akademik",
      description: "Jadwal, presensi, nilai, dan mapel.",
      href: "/admin/academic/teaching-assignments",
      icon: BookOpenCheck,
      tone: "cyan" as const,
      meta: `${formatNumber(overview.academic.subjects)} mapel`,
    },
    {
      title: "Keuangan",
      description: "Invoice, pembayaran, dan pengeluaran.",
      href: "/admin/finance",
      icon: Landmark,
      tone: "emerald" as const,
      meta: `${formatNumber(overview.finance.verifiedPayments)} bayar OK`,
    },
    {
      title: "PPDB",
      description: "Pendaftaran dan seleksi peserta didik baru.",
      href: "/admin/ppdb",
      icon: Building2,
      tone: "amber" as const,
      meta: `${formatNumber(overview.ppdb.activeRegistrations)} pendaftar`,
    },
    {
      title: "BKK",
      description: "Lowongan kerja, lamaran, dan alumni.",
      href: "/admin/bkk",
      icon: BriefcaseBusiness,
      tone: "blue" as const,
      meta: `${formatNumber(overview.programs.publishedJobs)} lowongan`,
    },
  ];
}

function ChartFrame({ children }: { children: ReactElement }) {
  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function QuickAlertsCard({ alerts }: { alerts: QuickAlerts }) {
  const rows = [
    {
      id: "overdue",
      label: "Invoice overdue",
      hint: "Tagihan melewati jatuh tempo",
      status: alerts.overdueInvoices.count > 0 ? "WARNING" : "OK",
      value: alerts.overdueInvoices.count,
    },
    {
      id: "attendance",
      label: "Presensi tanpa record",
      hint: "Sesi belum tercatat",
      status: alerts.attendanceMissing > 0 ? "WARNING" : "OK",
      value: alerts.attendanceMissing,
    },
    {
      id: "payments",
      label: "Pembayaran ditolak",
      hint: "Perlu verifikasi ulang",
      status: alerts.rejectedPayments > 0 ? "WARNING" : "OK",
      value: alerts.rejectedPayments,
    },
    {
      id: "notifications",
      label: "Notifikasi unread",
      hint: "Antrian notifikasi pengguna",
      status: alerts.unreadNotifications > 0 ? "UNREAD" : "OK",
      value: alerts.unreadNotifications,
    },
  ];

  return (
    <SectionCard
      action={
        <Badge variant={rows.some((row) => row.status !== "OK") ? "warning" : "success"}>
          {rows.filter((row) => row.status !== "OK").length} perhatian
        </Badge>
      }
      contentClassName="space-y-3"
      description="Indikator operasional yang perlu ditindaklanjuti."
      title="Quick Alerts"
    >
      {rows.map((row) => (
        <div className="dashboard-insight-row" key={row.id}>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={
                row.status === "OK"
                  ? "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                  : "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
              }
            >
              <AlertCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
              <p className="truncate text-xs text-muted-foreground">{row.hint}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatNumber(row.value)}</span>
            <StatusBadge value={row.status} />
          </div>
        </div>
      ))}
      {alerts.ppdbActive ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm text-primary ring-1 ring-primary/10">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              PPDB aktif: <span className="font-semibold">{alerts.ppdbActive.name}</span>, berakhir{" "}
              {new Date(alerts.ppdbActive.endDate).toLocaleDateString("id-ID")}.
            </p>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function SecondaryMetricsCard({ overview }: { overview: Overview }) {
  const metrics = [
    { icon: UsersRound, label: "Staff Aktif", value: overview.people.staffsActive },
    { icon: Building2, label: "Kelas", value: overview.academic.classrooms },
    { icon: Building2, label: "PPDB Aktif", value: overview.ppdb.activeRegistrations },
    { icon: BriefcaseBusiness, label: "Lowongan BKK", value: overview.programs.publishedJobs },
  ];

  return (
    <SectionCard contentClassName="grid gap-3 sm:grid-cols-2" description="Metrik pendukung operasional harian." title="Metrik Tambahan">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div className="dashboard-mini-metric" key={metric.label}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">{formatNumber(metric.value)}</p>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}

function RecentActivityCard({ activity }: { activity: ActivityFeedItem[] }) {
  return (
    <SectionCard
      action={activity.length > 0 ? <Badge variant="outline">{formatNumber(activity.length)} entri</Badge> : undefined}
      contentClassName="p-0 sm:p-0"
      description="Audit log terbaru dari aktivitas sistem."
      title="Aktivitas Terbaru"
    >
      {activity.length === 0 ? (
        <div className="p-6">
          <EmptyState description="Belum ada aktivitas audit." title="Tidak ada aktivitas" />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Aksi",
              key: "action",
              cell: (row) => (
                <span className="inline-flex rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">{row.action}</span>
              ),
            },
            { header: "Entitas", key: "entity" },
            { header: "Actor", key: "actor", cell: (row) => row.actor?.name ?? row.actor?.email ?? "System" },
            {
              header: "Waktu",
              key: "createdAt",
              cell: (row) => <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleString("id-ID")}</span>,
            },
          ]}
          data={activity.slice(0, 8)}
          getRowId={(row) => row.id}
          minWidth="min-w-[720px]"
        />
      )}
    </SectionCard>
  );
}

function SystemStatusCard({ status, unread }: { status: SystemStatus; unread: number }) {
  const rows = [
    { icon: Server, label: "API", value: status.api.status, detail: `uptime ${formatNumber(status.api.uptime)}s · v${status.api.version}` },
    { icon: Database, label: "Database", value: status.database.status, detail: status.database.provider },
    { icon: Activity, label: "Redis", value: status.redis.status, detail: status.redis.available ? "available" : "check config" },
    { icon: Bell, label: "Notifikasi Unread", value: `${unread}`, detail: "across users" },
  ];

  return (
    <SectionCard contentClassName="space-y-3" description="Kesehatan layanan runtime." title="Status Sistem">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div className="dashboard-insight-row" key={row.label}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
                <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
              </div>
            </div>
            <StatusBadge value={row.value} />
          </div>
        );
      })}
      <Button asChild className="w-full" variant="soft">
        <Link href="/admin/reports">
          <BarChart3 className="h-4 w-4" /> Buka Report Center
        </Link>
      </Button>
    </SectionCard>
  );
}

const tooltipStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { currency: "IDR", maximumFractionDigits: 0, style: "currency" }).format(value ?? 0);
}
