"use client";

import {
  DoorOpen,
  Clock,
  Users,
  Award,
  Banknote,
  BookOpen,
  BarChart3,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Library,
  Loader2,
  LogOut,
  Menu,
  Newspaper,
  PanelLeftClose,
  PlusCircle,
  PanelLeftOpen,
  School,
  Search,
  Settings,
  UserCog,
  WalletCards,
  UsersRound,
  X,
  UserCheck,
  CalendarOff,
  Wallet,
  CalendarClock,
  Receipt,
  Coins,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode, useEffect, useState } from "react";

import type { AuthUser, NotificationRecord } from "@nexsmsid/api-client";
import { Avatar, Button, cn, Input } from "@nexsmsid/ui";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession, getStoredUser, storeAuthSession, storeUser } from "@/lib/auth-storage";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { portalHomePath, resolvePortalForUser } from "@/lib/portal-routing";
import { applySchoolTheme, loadSchoolTheme } from "@/lib/school-theme";

type NavigationItem = { href: string; icon: LucideIcon; label: string; permission?: string };
type NavigationGroup = { label: string; items: NavigationItem[] };

const navigationGroups: NavigationGroup[] = [
  {
    label: "Utama",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard.view" },
      { href: "/admin/school-profile", icon: School, label: "Profil Sekolah", permission: "school-profile.view" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/students", icon: UsersRound, label: "Siswa", permission: "students.view" },
      { href: "/admin/guardians", icon: HeartHandshake, label: "Wali/Orang Tua", permission: "guardians.view" },
      { href: "/admin/teachers", icon: UserCog, label: "Guru", permission: "teachers.view" },
      { href: "/admin/staffs", icon: BriefcaseBusiness, label: "Staff", permission: "staffs.view" },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/admin/master-data/academic-years", icon: CalendarDays, label: "Tahun Ajaran", permission: "master-data.view" },
      { href: "/admin/master-data/semesters", icon: ClipboardList, label: "Semester", permission: "master-data.view" },
      { href: "/admin/master-data/departments", icon: Building2, label: "Jurusan", permission: "master-data.view" },
      { href: "/admin/master-data/competencies", icon: GraduationCap, label: "Program Keahlian", permission: "master-data.view" },
      { href: "/admin/master-data/classrooms", icon: UsersRound, label: "Kelas", permission: "master-data.view" },
      { href: "/admin/master-data/subjects", icon: BookOpenCheck, label: "Mata Pelajaran", permission: "master-data.view" },
      { href: "/admin/master-data/rooms", icon: DoorOpen, label: "Ruangan", permission: "master-data.view" },
      { href: "/admin/master-data/lesson-hours", icon: Clock, label: "Jam Pelajaran", permission: "master-data.view" },
      { href: "/admin/master-data/payment-categories", icon: WalletCards, label: "Kategori Pembayaran", permission: "master-data.view" },
    ],
  },
  {
    label: "Akademik",
    items: [
      { href: "/admin/academic/teaching-assignments", icon: ClipboardList, label: "Mengajar", permission: "teaching-assignments.view" },
      { href: "/admin/academic/schedules", icon: CalendarDays, label: "Jadwal", permission: "schedules.view" },
      { href: "/admin/academic/attendance", icon: ClipboardCheck, label: "Presensi", permission: "attendance.view" },
      { href: "/admin/academic/grades", icon: Award, label: "Nilai", permission: "grades.view" },
      { href: "/admin/academic/reports", icon: BarChart3, label: "Laporan", permission: "reports.view" },
    ],
  },
  {
    label: "BK & Kedisiplinan",
    items: [
      { href: "/admin/counseling/cases", icon: HeartHandshake, label: "Kasus BK", permission: "counseling.view" },
      { href: "/admin/discipline/rules", icon: ClipboardList, label: "Aturan Kedisiplinan", permission: "discipline.view" },
      { href: "/admin/discipline/violations", icon: ClipboardCheck, label: "Pelanggaran", permission: "discipline.view" },
      { href: "/admin/discipline/achievements", icon: Award, label: "Prestasi", permission: "discipline.view" },
      { href: "/admin/discipline/summary", icon: BarChart3, label: "Ringkasan Disiplin", permission: "discipline.report" },
      { href: "/admin/discipline/reports", icon: FileText, label: "Laporan BK", permission: "reports.view" },
    ],
  },
  {
    label: "Surat Menyurat",
    items: [
      { href: "/admin/letters/templates", icon: ClipboardList, label: "Template Surat", permission: "letters.manage-templates" },
      { href: "/admin/letters", icon: FileText, label: "Arsip Surat", permission: "letters.view" },
      { href: "/admin/letters/create", icon: FileText, label: "Buat Surat", permission: "letters.create" },
      { href: "/admin/letters/approvals", icon: ClipboardCheck, label: "Approval Surat", permission: "letters.approve" },
      { href: "/admin/letters/reports", icon: BarChart3, label: "Rekap Surat", permission: "letters.report" },
    ],
  },
  {
    label: "Keuangan & PPDB",
    items: [
      { href: "/admin/finance", icon: Landmark, label: "Keuangan", permission: "finance.view" },
      { href: "/admin/finance/invoices", icon: FileText, label: "Tagihan", permission: "invoices.view" },
      { href: "/admin/finance/payments", icon: WalletCards, label: "Pembayaran", permission: "payments.view" },
      { href: "/admin/finance/expenses", icon: BriefcaseBusiness, label: "Pengeluaran", permission: "expenses.view" },
      { href: "/admin/finance/reports", icon: BarChart3, label: "Laporan Keuangan", permission: "reports.view" },
      { href: "/admin/ppdb", icon: GraduationCap, label: "PPDB", permission: "ppdb.view" },
      { href: "/admin/ppdb/periods", icon: CalendarDays, label: "Periode PPDB", permission: "ppdb.view" },
      { href: "/admin/ppdb/registrations", icon: FileText, label: "Pendaftaran PPDB", permission: "ppdb.view" },
      { href: "/admin/ppdb/reports", icon: BarChart3, label: "Laporan PPDB", permission: "reports.view" },
    ],
  },
  {
    label: "PKL & BKK",
    items: [
      { href: "/admin/industry-partners", icon: Building2, label: "Mitra Industri", permission: "industry-partners.view" },
      { href: "/admin/internships", icon: BriefcaseBusiness, label: "Data PKL", permission: "internships.view" },
      { href: "/admin/internships/logs", icon: ClipboardList, label: "Jurnal PKL", permission: "internship-logs.view" },
      { href: "/admin/bkk", icon: BarChart3, label: "BKK", permission: "bkk.view" },
      { href: "/admin/alumni", icon: GraduationCap, label: "Alumni", permission: "alumni.view" },
      { href: "/admin/bkk/jobs", icon: Newspaper, label: "Lowongan Kerja", permission: "job-vacancies.view" },
      { href: "/admin/bkk/applications", icon: FileText, label: "Lamaran", permission: "job-applications.view" },
      { href: "/admin/bkk/tracer-studies", icon: ClipboardCheck, label: "Tracer Study", permission: "tracer-studies.view" },
      { href: "/admin/bkk/reports", icon: BarChart3, label: "Laporan BKK", permission: "reports.view" },
    ],
  },
  {
    label: "Komunikasi",
    items: [
      { href: "/admin/communication/announcements", icon: Newspaper, label: "Pengumuman", permission: "announcements.view" },
      { href: "/admin/communication/messages", icon: FileText, label: "Pesan Internal", permission: "messages.view" },
      { href: "/admin/communication/notifications", icon: Bell, label: "Notifikasi", permission: "notifications.view" },
      {
        href: "/admin/communication/templates",
        icon: ClipboardList,
        label: "Template Notifikasi",
        permission: "notification-templates.view",
      },
      { href: "/admin/communication/reports", icon: BarChart3, label: "Laporan", permission: "reports.view" },
    ],
  },
  {
    label: "Ujian / CBT",
    items: [
      { href: "/admin/exams/types", icon: ClipboardList, label: "Tipe Ujian", permission: "exams.view" },
      { href: "/admin/exams/rooms", icon: DoorOpen, label: "Ruangan", permission: "exams.view" },
      { href: "/admin/exams", icon: GraduationCap, label: "Data Ujian", permission: "exams.view" },
      { href: "/admin/exams/create", icon: PlusCircle, label: "Buat Ujian", permission: "exams.create" },
      { href: "/admin/exams/banks", icon: Library, label: "Bank Soal", permission: "exams.view" },
      { href: "/admin/exams/reports", icon: BarChart3, label: "Laporan", permission: "exams.view" },
    ],
  },
  {
    label: "Inventaris / Sarpras",
    items: [
      { href: "/admin/inventory", icon: Building2, label: "Dashboard Inventaris", permission: "inventory.view" },
      { href: "/admin/inventory/categories", icon: ClipboardList, label: "Kategori", permission: "inventory.view" },
      { href: "/admin/inventory/items", icon: BriefcaseBusiness, label: "Data Barang", permission: "inventory.view" },
      { href: "/admin/inventory/locations", icon: DoorOpen, label: "Lokasi", permission: "inventory.view" },
      { href: "/admin/inventory/movements", icon: ClipboardCheck, label: "Mutasi Barang", permission: "inventory.view" },
      { href: "/admin/inventory/maintenances", icon: Settings, label: "Pemeliharaan", permission: "inventory.maintenance" },
      { href: "/admin/inventory/loans", icon: HeartHandshake, label: "Peminjaman", permission: "inventory.borrow" },
      { href: "/admin/inventory/reports", icon: BarChart3, label: "Laporan Inventaris", permission: "inventory.view" },
    ],
  },
  {
    label: "Perpustakaan",
    items: [
      { href: "/admin/library", icon: BookOpen, label: "Dashboard Perpustakaan", permission: "library.view" },
      { href: "/admin/library/categories", icon: ClipboardList, label: "Kategori", permission: "library.view" },
      { href: "/admin/library/books", icon: BookOpen, label: "Data Buku", permission: "library.view" },
      { href: "/admin/library/copies", icon: BookOpenCheck, label: "Eksemplar", permission: "library.view" },
      { href: "/admin/library/shelves", icon: Library, label: "Rak", permission: "library.view" },
      { href: "/admin/library/members", icon: Users, label: "Anggota", permission: "library.view" },
      { href: "/admin/library/loans", icon: HeartHandshake, label: "Peminjaman", permission: "library.borrow" },
      { href: "/admin/library/reservations", icon: CalendarDays, label: "Reservasi", permission: "library.view" },
      { href: "/admin/library/fines", icon: Coins, label: "Denda", permission: "library.view" },
      { href: "/admin/library/reports", icon: BarChart3, label: "Laporan", permission: "library.view" },
    ],
  },
  {
    label: "HR & Payroll",
    items: [
      { href: "/admin/hr", icon: Users, label: "Dashboard HR", permission: "payroll.view" },
      { href: "/admin/hr/employees", icon: UserCheck, label: "Data Pegawai", permission: "payroll.view" },
      { href: "/admin/hr/positions", icon: BriefcaseBusiness, label: "Jabatan HR", permission: "payroll.view" },
      { href: "/admin/hr/attendance", icon: Clock, label: "Kehadiran", permission: "payroll.view" },
      { href: "/admin/hr/leaves", icon: CalendarOff, label: "Cuti & Izin", permission: "payroll.view" },
      { href: "/admin/payroll", icon: Wallet, label: "Dashboard Payroll", permission: "payroll.view" },
      { href: "/admin/payroll/components", icon: Coins, label: "Komponen Gaji", permission: "payroll.view" },
      { href: "/admin/payroll/settings", icon: Settings, label: "Setting Gaji", permission: "payroll.view" },
      { href: "/admin/payroll/periods", icon: CalendarClock, label: "Periode Penggajian", permission: "payroll.view" },
      { href: "/admin/payroll/runs", icon: Receipt, label: "Daftar Gaji", permission: "payroll.view" },
      { href: "/admin/payroll/payslips", icon: FileText, label: "Slip Gaji", permission: "payroll.view" },
      { href: "/admin/payroll/payments", icon: Wallet, label: "Pembayaran Gaji", permission: "payroll.pay" },
      { href: "/admin/payroll/reports", icon: BarChart3, label: "Laporan Payroll", permission: "payroll.view" },
    ],
  },
  {
    label: "Laporan",
    items: [
      { href: "/admin/reports", icon: BarChart3, label: "Report Center", permission: "reports.view" },
      { href: "/admin/reports/jobs", icon: FileText, label: "Report Jobs", permission: "report-jobs.view" },
      { href: "/admin/reports/exports", icon: ClipboardCheck, label: "Export History", permission: "export-history.view" },
    ],
  },
  {
    label: "Pengaturan",
    items: [{ href: "/account/security", icon: UserCog, label: "Keamanan Akun", permission: "auth.change-password" }],
  },
];

const navigation = navigationGroups.flatMap((group) => group.items);

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [navSearch, setNavSearch] = useState("");

  const sidebarWidth = collapsed ? "lg:w-[4.5rem]" : "lg:w-64";
  const labelVisibility = collapsed ? "lg:hidden" : "lg:block";
  const currentPage = getCurrentPageLabel(pathname);
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const matchesPermission = !item.permission || authUser?.permissions.includes(item.permission);
        const query = navSearch.trim().toLowerCase();
        const matchesSearch = !query || item.label.toLowerCase().includes(query) || group.label.toLowerCase().includes(query);
        return matchesPermission && matchesSearch;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const activeGroup = navigationGroups.find((g) => g.items.some((item) => item.href === pathname));
    return new Set(activeGroup ? [activeGroup.label] : []);
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const user = await createBrowserApiClient().me();
        if (user.forceChangePassword && window.location.pathname !== "/account/change-password") {
          router.replace("/account/change-password");
          return;
        }
        const portal = resolvePortalForUser(user);
        if (portal !== "admin") {
          router.replace(portalHomePath(portal));
          return;
        }
        storeUser(user);
        if (active) setAuthUser(user);
      } catch {
        try {
          const session = await createBrowserApiClient().refresh();
          storeAuthSession(session);
          const user = session.user;
          if (user.forceChangePassword && window.location.pathname !== "/account/change-password") {
            router.replace("/account/change-password");
            return;
          }
          const portal = resolvePortalForUser(user);
          if (portal !== "admin") {
            router.replace(portalHomePath(portal));
            return;
          }
          if (active) setAuthUser(user);
        } catch {
          clearAuthSession();
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (authUser?.forceChangePassword && pathname !== "/account/change-password") {
      router.replace("/account/change-password");
    }
  }, [authUser?.forceChangePassword, pathname, router]);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.id) {
      const socket = connectSocket();

      function handleNotification(data: unknown) {
        if (typeof data !== "object" || data === null || !("title" in data)) return;
        setNotifications((prev) => [data as NotificationRecord, ...prev].slice(0, 20));
      }

      socket?.on("notification", handleNotification);
      loadSchoolTheme().then((theme) => {
        if (theme) applySchoolTheme(theme);
      });
      return () => {
        socket?.off("notification", handleNotification);
        disconnectSocket();
      };
    }
  }, [authUser?.id]);

  async function handleLogout() {
    try {
      await createBrowserApiClient().logout();
    } catch {
      // Local session cleanup still happens when the API call fails.
    }

    disconnectSocket();
    clearAuthSession();
    startTransition(() => router.replace("/login"));
  }

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div className="animate-fade-in">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Memeriksa sesi NexAdmin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {mobileOpen ? (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}

      <div className="lg:flex">
        <aside
          className={cn(
            "nexadmin-sidebar fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-border bg-white transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            mobileOpen && "translate-x-0 shadow-premium",
            sidebarWidth,
          )}
        >
          <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className={cn("min-w-0", labelVisibility)}>
                <span className="block truncate text-base font-semibold tracking-tight text-foreground">NexAdmin</span>
                <span className="block truncate text-xs text-muted-foreground">Enterprise Panel</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Button
                aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed((value) => !value)}
                size="icon"
                variant="ghost"
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
              <Button aria-label="Tutup sidebar" className="lg:hidden" onClick={() => setMobileOpen(false)} size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className={cn("border-b border-border px-3 py-3", collapsed && "lg:px-2")}>
            <div className={cn("relative", collapsed && "lg:hidden")}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-border bg-muted/40 pl-9 shadow-none focus:bg-white"
                onChange={(event) => setNavSearch(event.target.value)}
                placeholder="Cari menu..."
                value={navSearch}
              />
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {visibleNavigationGroups.map((group) => {
              const isOpen = openGroups.has(group.label);

              return (
                <div key={group.label}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-muted/60 hover:text-foreground",
                      labelVisibility,
                    )}
                    onClick={() => toggleGroup(group.label)}
                    type="button"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isOpen && "rotate-0",
                        !isOpen && "-rotate-90",
                        collapsed && "lg:hidden",
                      )}
                    />
                    <span className={cn("flex-1 text-left", labelVisibility)}>{group.label}</span>
                  </button>
                  {isOpen ? (
                    <div className="mt-0.5 space-y-0.5">
                      {group.items.map((item) => {
                        const active = item.href === pathname;
                        const Icon = item.icon;

                        return (
                          <Link
                            className={cn(
                              "nav-item-pill flex items-center gap-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground",
                              active && "nav-item-active",
                              collapsed && "lg:justify-center lg:px-2",
                            )}
                            href={item.href}
                            key={item.label}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className={cn("truncate", labelVisibility)}>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <div className={cn("rounded-xl border border-border bg-muted/30 p-3", collapsed && "lg:p-2")}>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Settings className="h-4 w-4" />
                </span>
                <div className={cn("min-w-0", labelVisibility)}>
                  <p className="truncate text-sm font-medium text-foreground">{authUser?.name ?? "Operator"}</p>
                  <p className="truncate text-xs text-muted-foreground">{authUser?.email ?? "NexAdmin"}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="glass-header sticky top-0 z-30">
            <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Button className="lg:hidden" onClick={() => setMobileOpen(true)} size="icon" variant="outline">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
                <Link className="font-medium hover:text-primary" href="/admin">
                  NexAdmin
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{currentPage}</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {authUser?.permissions.includes("notifications.view") ? (
                  <Button asChild className="relative" size="icon" variant="outline">
                    <Link href="/admin/communication/notifications" title="Notifikasi">
                      <Bell className="h-4 w-4" />
                      {notifications.length > 0 ? (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                          {formatCount(notifications.length)}
                        </span>
                      ) : null}
                    </Link>
                  </Button>
                ) : null}
                <div className="hidden items-center gap-3 sm:flex">
                  <Avatar fallback={getInitials(authUser?.name ?? "Admin")} />
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium">{authUser?.name ?? "Admin Sekolah"}</p>
                    <p className="text-xs text-muted-foreground">{authUser?.email ?? "Operator"}</p>
                  </div>
                </div>
                <LocaleSwitcher />
                <ThemeToggle />
                <Button aria-label="Logout" onClick={handleLogout} size="icon" variant="outline">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD"
  );
}

function formatCount(value: number) {
  return value > 99 ? "99+" : String(value);
}

function getCurrentPageLabel(pathname: string) {
  const match = navigation.find((item) => item.href === pathname);

  if (match) {
    return match.label;
  }

  if (pathname.startsWith("/admin/master-data/")) {
    return "Master Data";
  }

  if (pathname.startsWith("/admin/academic/")) {
    return "Akademik";
  }

  if (pathname.startsWith("/admin/finance/")) {
    return "Keuangan";
  }

  if (pathname.startsWith("/admin/ppdb/")) {
    return "PPDB";
  }

  if (pathname.startsWith("/admin/")) {
    return "Admin";
  }

  return "Dashboard";
}
