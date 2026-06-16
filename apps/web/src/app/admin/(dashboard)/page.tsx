"use client";

import {
  Activity,
  AlertCircle,
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
  Newspaper,
  RefreshCcw,
  Server,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  Badge,
  Button,
  ChartCard,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  ModuleCard,
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

const modules = [
  {
    title: "Siswa",
    description: "Data peserta didik aktif dan relasi kelas.",
    href: "/admin/students",
    icon: UsersRound,
    tone: "teal" as const,
  },
  {
    title: "Guru",
    description: "Profil guru dan teaching assignment.",
    href: "/admin/teachers",
    icon: GraduationCap,
    tone: "blue" as const,
  },
  {
    title: "Akademik",
    description: "Jadwal, presensi, nilai, dan mapel.",
    href: "/admin/academic/teaching-assignments",
    icon: BookOpenCheck,
    tone: "cyan" as const,
  },
  {
    title: "Keuangan",
    description: "Invoice, pembayaran, dan pengeluaran.",
    href: "/admin/finance",
    icon: Landmark,
    tone: "emerald" as const,
  },
  {
    title: "PPDB",
    description: "Pendaftaran dan seleksi peserta didik baru.",
    href: "/admin/ppdb",
    icon: Building2,
    tone: "amber" as const,
  },
  { title: "BKK", description: "Lowongan kerja, lamaran, dan alumni.", href: "/admin/bkk", icon: BriefcaseBusiness, tone: "blue" as const },
];

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
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
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

  return (
    <div className="space-y-8">
      <div className="enterprise-hero">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3" variant="soft">
              Enterprise Dashboard
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Selamat datang di NexAdmin</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Ringkasan operasional sekolah — akademik, keuangan, PPDB, SDM, dan aktivitas sistem dalam satu tampilan premium.
            </p>
          </div>
          <Button onClick={() => void refetch()} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          title="Siswa Aktif"
          tone="teal"
          value={formatNumber(data.overview.people.studentsActive)}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Guru Aktif"
          tone="blue"
          value={formatNumber(data.overview.people.teachersActive)}
        />
        <StatCard
          description={`${formatNumber(data.overview.finance.outstandingInvoices)} invoice`}
          icon={<WalletCards className="h-5 w-5" />}
          title="Tagihan Belum Lunas"
          tone="amber"
          value={formatCurrency(data.overview.finance.outstandingAmount)}
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          title="Absensi Minggu Ini"
          tone="emerald"
          value={formatNumber(data.overview.academic.attendanceSessionsThisWeek)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          title="Staff"
          tone="emerald"
          value={formatNumber(data.overview.people.staffsActive)}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          title="Kelas"
          tone="teal"
          value={formatNumber(data.overview.academic.classrooms)}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          title="PPDB Aktif"
          tone="violet"
          value={formatNumber(data.overview.ppdb.activeRegistrations)}
        />
        <StatCard
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          title="Lowongan Aktif"
          tone="blue"
          value={formatNumber(data.overview.programs.publishedJobs)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          action={<Badge variant="info">Real API</Badge>}
          description="Distribusi pendaftaran berdasarkan status."
          title="PPDB Status Chart"
        >
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={ppdbStatusData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="status" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#14997a" name="Pendaftar" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          action={<Badge variant="success">Cashflow</Badge>}
          description="Pembayaran terverifikasi dibanding pengeluaran."
          title="Finance Monthly Cashflow"
        >
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={financeMonthly} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickFormatter={(v) => `${Number(v) / 1_000_000}jt`} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Area dataKey="income" fill="#10b98133" name="Masuk" stroke="#10b981" strokeWidth={3} type="monotone" />
                <Area dataKey="expense" fill="#f59e0b33" name="Keluar" stroke="#f59e0b" strokeWidth={3} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          action={<Badge variant="secondary">Minggu Ini</Badge>}
          description="Rekap status presensi minggu berjalan."
          title="Attendance Overview"
        >
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={attendanceData} dataKey="count" innerRadius={58} nameKey="status" outerRadius={96} paddingAngle={3}>
                  {attendanceData.map((entry, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={entry.status} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard action={<Badge variant="outline">People</Badge>} description="Komposisi data orang di sekolah." title="People Overview">
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={peopleData} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tickMargin={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="#0ea5e9" name="Total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <QuickAlertsCard alerts={data.alerts} />
        <RecentActivityCard activity={data.activity} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <SectionCard description="Pintasan modul utama untuk operator sekolah." title="Module Shortcuts">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return <ModuleCard key={module.href} {...module} icon={<Icon className="h-5 w-5" />} />;
            })}
          </div>
        </SectionCard>
        <SystemStatusCard status={data.system} unread={data.overview.notifications.unread} />
      </div>
    </div>
  );
}

function QuickAlertsCard({ alerts }: { alerts: QuickAlerts }) {
  const rows = [
    {
      id: "overdue",
      label: "Invoice overdue",
      status: alerts.overdueInvoices.count > 0 ? "WARNING" : "OK",
      value: alerts.overdueInvoices.count,
    },
    {
      id: "attendance",
      label: "Presensi tanpa record",
      status: alerts.attendanceMissing > 0 ? "WARNING" : "OK",
      value: alerts.attendanceMissing,
    },
    { id: "payments", label: "Pembayaran ditolak", status: alerts.rejectedPayments > 0 ? "WARNING" : "OK", value: alerts.rejectedPayments },
    {
      id: "notifications",
      label: "Notifikasi unread",
      status: alerts.unreadNotifications > 0 ? "UNREAD" : "OK",
      value: alerts.unreadNotifications,
    },
  ];

  return (
    <SectionCard description="Alert operasional yang perlu dipantau." title="Quick Alerts">
      <div className="space-y-3">
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-3" key={row.id}>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">Total {formatNumber(row.value)}</p>
              </div>
            </div>
            <StatusBadge value={row.status} />
          </div>
        ))}
        {alerts.ppdbActive ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary ring-1 ring-primary/10">
            PPDB aktif: <span className="font-bold">{alerts.ppdbActive.name}</span>, berakhir{" "}
            {new Date(alerts.ppdbActive.endDate).toLocaleDateString("id-ID")}.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function RecentActivityCard({ activity }: { activity: ActivityFeedItem[] }) {
  return (
    <SectionCard description="Audit log terbaru dari sistem." title="Recent Activity">
      {activity.length === 0 ? (
        <EmptyState description="Belum ada aktivitas audit." title="Tidak ada aktivitas" />
      ) : (
        <DataTable
          columns={[
            { header: "Action", key: "action", cell: (row) => <span className="font-bold text-foreground">{row.action}</span> },
            { header: "Entity", key: "entity" },
            { header: "Actor", key: "actor", cell: (row) => row.actor?.name ?? row.actor?.email ?? "System" },
            { header: "Waktu", key: "createdAt", cell: (row) => new Date(row.createdAt).toLocaleString("id-ID") },
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
    { icon: Server, label: "API", value: status.api.status, detail: `uptime ${formatNumber(status.api.uptime)}s` },
    { icon: Database, label: "Database", value: status.database.status, detail: status.database.provider },
    { icon: Activity, label: "Redis", value: status.redis.status, detail: status.redis.available ? "available" : "check config" },
    { icon: Bell, label: "Unread Notifications", value: `${unread}`, detail: "across users" },
  ];

  return (
    <SectionCard description="Status layanan runtime dan indikator sistem." title="System Status">
      <ul className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3" key={row.label}>
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.detail}</p>
                </div>
              </div>
              <StatusBadge value={row.value} />
            </li>
          );
        })}
      </ul>
      <Button asChild className="mt-4 w-full" variant="soft">
        <Link href="/admin/reports">
          <BarChart3 className="h-4 w-4" /> Lihat Laporan
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
