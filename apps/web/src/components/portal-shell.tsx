"use client";

import {
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Users,
  WalletCards,
  Wallet,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode, useCallback, useEffect, useState } from "react";

import type { AuthUser } from "@nexsmsid/api-client";
import { Avatar, Badge, Button, cn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession, getStoredUser, storeAuthSession, storeUser } from "@/lib/auth-storage";
import { resolvePortalForUser, portalHomePath, type PortalKind } from "@/lib/portal-routing";

type NavItem = { href: string; icon: LucideIcon; label: string };

const portalNavigation: Record<PortalKind, { title: string; items: NavItem[] }> = {
  teacher: {
    title: "Portal Guru",
    items: [
      { href: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/teacher/schedules", icon: BookOpen, label: "Jadwal Mengajar" },
      { href: "/teacher/attendance", icon: ClipboardCheck, label: "Presensi" },
      { href: "/teacher/grades", icon: GraduationCap, label: "Penilaian" },
      { href: "/teacher/notifications", icon: Bell, label: "Notifikasi" },
      { href: "/account/security", icon: UserCog, label: "Keamanan Akun" },
    ],
  },
  student: {
    title: "Portal Siswa",
    items: [
      { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/student/schedules", icon: BookOpen, label: "Jadwal Pelajaran" },
      { href: "/student/attendance", icon: ClipboardCheck, label: "Presensi" },
      { href: "/student/grades", icon: GraduationCap, label: "Nilai" },
      { href: "/student/discipline", icon: ClipboardCheck, label: "Kedisiplinan" },
      { href: "/student/invoices", icon: WalletCards, label: "Tagihan" },
      { href: "/student/announcements", icon: Newspaper, label: "Pengumuman" },
      { href: "/student/notifications", icon: Bell, label: "Notifikasi" },
      { href: "/account/security", icon: UserCog, label: "Keamanan Akun" },
    ],
  },
  guardian: {
    title: "Portal Wali",
    items: [
      { href: "/guardian", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/guardian/children", icon: Users, label: "Anak" },
      { href: "/guardian/attendance", icon: ClipboardCheck, label: "Presensi Anak" },
      { href: "/guardian/grades", icon: GraduationCap, label: "Nilai Anak" },
      { href: "/guardian/discipline", icon: ClipboardCheck, label: "Kedisiplinan Anak" },
      { href: "/guardian/invoices", icon: Wallet, label: "Tagihan Anak" },
      { href: "/guardian/announcements", icon: Newspaper, label: "Pengumuman" },
      { href: "/guardian/notifications", icon: Bell, label: "Notifikasi" },
      { href: "/account/security", icon: UserCog, label: "Keamanan Akun" },
    ],
  },
  admin: {
    title: "Admin",
    items: [],
  },
  unassigned: {
    title: "Akun Belum Ditugaskan",
    items: [],
  },
};

const portalAccent: Record<PortalKind, string> = {
  teacher: "from-indigo-500 to-violet-600",
  student: "from-sky-500 to-indigo-600",
  guardian: "from-violet-500 to-indigo-600",
  admin: "from-muted-foreground to-foreground",
  unassigned: "from-muted-foreground to-foreground",
};

export type PortalShellProps = {
  children: ReactNode;
  expectedPortal: PortalKind;
};

export function PortalShell({ children, expectedPortal }: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canViewNotifications = user?.permissions.includes("notifications.view") ?? false;
  const notificationPath = `${portalHomePath(expectedPortal)}/notifications`;
  const loadUnreadCount = useCallback(async () => {
    const result = await createBrowserApiClient().unreadNotificationCount();
    return result.total;
  }, []);
  const { data: unreadCount = 0 } = useApiQuery(loadUnreadCount, [user?.id], {
    enabled: ready && canViewNotifications,
  });
  const unreadNotifications = unreadCount ?? 0;

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const cached = getStoredUser();
      if (cached) {
        const portal = resolvePortalForUser(cached);
        if (portal !== expectedPortal) {
          router.replace(portalHomePath(portal));
          return;
        }
        setUser(cached);
      }

      try {
        const user = await createBrowserApiClient().me();
        if (!active) return;
        if (user.forceChangePassword && window.location.pathname !== "/account/change-password") {
          router.replace("/account/change-password");
          return;
        }
        storeUser(user);
        const portal = resolvePortalForUser(user);
        if (portal !== expectedPortal) {
          router.replace(portalHomePath(portal));
          return;
        }
        setUser(user);
        setReady(true);
      } catch {
        try {
          const session = await createBrowserApiClient().refresh();
          if (!active) return;
          storeAuthSession(session);
          const user = session.user;
          if (user.forceChangePassword && window.location.pathname !== "/account/change-password") {
            router.replace("/account/change-password");
            return;
          }
          const portal = resolvePortalForUser(user);
          if (portal !== expectedPortal) {
            router.replace(portalHomePath(portal));
            return;
          }
          setUser(user);
          setReady(true);
        } catch {
          if (active) {
            clearAuthSession();
            const next = encodeURIComponent(window.location.pathname || portalHomePath(expectedPortal));
            router.replace(`/login?next=${next}`);
          }
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [expectedPortal, router]);

  async function handleLogout() {
    try {
      await createBrowserApiClient().logout();
    } catch {
      // Local session cleanup still happens when the API call fails.
    }
    clearAuthSession();
    startTransition(() => router.replace("/login"));
  }

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Memuat portal NexAdmin...</p>
        </div>
      </div>
    );
  }

  const config = portalNavigation[expectedPortal];
  const items = config.items;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button onClick={() => setMobileOpen((v) => !v)} size="icon" variant="ghost" className="lg:hidden">
              {mobileOpen ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                portalAccent[expectedPortal],
              )}
            >
              <School className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">NexAdmin Portal</p>
              <p className="text-sm font-semibold leading-tight text-foreground">{config.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canViewNotifications ? (
              <Button asChild className="relative" size="icon" variant="outline">
                <Link href={notificationPath}>
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {formatCount(unreadNotifications)}
                    </span>
                  ) : null}
                </Link>
              </Button>
            ) : null}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.roles.join(", ") || "Tanpa role"}</p>
            </div>
            <Avatar fallback={user.name?.charAt(0)?.toUpperCase() ?? "U"} />
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className={cn("hidden shrink-0 lg:block", collapsed ? "w-16" : "w-64")}>
          <div className="sticky top-24 space-y-2">
            <Button className="w-full justify-start" onClick={() => setCollapsed((v) => !v)} size="sm" variant="ghost">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {!collapsed ? "Tutup" : ""}
            </Button>
            <nav className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== portalHomePath(expectedPortal) && pathname?.startsWith(item.href));
                const Icon = item.icon;
                const notificationItem = item.href === notificationPath;
                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-l-2 border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed ? <span>{item.label}</span> : null}
                    {notificationItem && unreadNotifications > 0 ? (
                      <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {formatCount(unreadNotifications)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            {!collapsed ? (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-surface-muted p-4 text-xs text-muted-foreground">
                <Badge variant="info" className="mb-2">
                  Tips
                </Badge>
                <p className="leading-relaxed">
                  Menu disusun khusus untuk peran <span className="font-medium text-foreground">{user.roles.join(", ")}</span>. Data yang
                  tampil hanya yang terkait dengan akun Anda.
                </p>
              </div>
            ) : null}
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-card p-4 shadow-elevated">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{config.title}</p>
                <Button onClick={() => setMobileOpen(false)} size="icon" variant="ghost">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1">
                {items.map((item) => {
                  const active =
                    pathname === item.href || (item.href !== portalHomePath(expectedPortal) && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  const notificationItem = item.href === notificationPath;
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "border-l-2 border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {notificationItem && unreadNotifications > 0 ? (
                        <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {formatCount(unreadNotifications)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-muted-foreground sm:px-6">
        NexAdmin Portal — Hak akses otomatis disesuaikan dengan peran {user.roles.join(", ") || "pengguna"}.
      </footer>
    </div>
  );
}

function formatCount(value: number) {
  return value > 99 ? "99+" : String(value);
}
