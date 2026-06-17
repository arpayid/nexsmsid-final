"use client";

import { GraduationCap, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button, cn } from "@nexsmsid/ui";

import { usePublicSchool } from "@/components/public-school-provider";
import { SkipToContent } from "@/components/skip-to-content";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/jurusan", label: "Jurusan" },
  { href: "/ppdb", label: "PPDB" },
  { href: "/announcements", label: "Berita" },
  { href: "/jobs", label: "BKK" },
  { href: "/mitra", label: "Mitra" },
  { href: "/kontak", label: "Kontak" },
];

export function PublicShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { profile } = usePublicSchool();
  const [open, setOpen] = useState(false);
  const schoolName = profile?.name ?? "Sekolah Menengah Kejuruan";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SkipToContent targetId="main-content" />
      <header className="glass-header sticky top-0 z-40 border-b border-border/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/">
            {profile?.logoUrl ? (
              <img alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-primary/20" data-school-logo src={profile.logoUrl} />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-glow">
                <GraduationCap className="h-5 w-5" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold sm:text-base">{schoolName}</span>
              <span className="block truncate text-xs text-muted-foreground">Website Resmi · NexSMSID</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="hidden md:inline-flex" size="sm" variant="outline">
              <Link href="/ppdb/register">Daftar PPDB</Link>
            </Button>
            <Button aria-label="Buka menu" className="lg:hidden" onClick={() => setOpen((v) => !v)} size="icon" variant="outline">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open ? (
          <nav className="border-t border-border px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                className="rounded-lg px-3 py-2 text-sm font-semibold text-primary"
                href="/ppdb/register"
                onClick={() => setOpen(false)}
              >
                Daftar PPDB
              </Link>
            </div>
          </nav>
        ) : null}
      </header>

      <main className="flex-1" id="main-content">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <p className="text-base font-semibold text-foreground">{schoolName}</p>
            {profile?.description ? <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{profile.description}</p> : null}
            {profile?.address ? <p className="mt-3 text-sm text-muted-foreground">{profile.address}</p> : null}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile?.phone ? <span>{profile.phone}</span> : null}
              {profile?.email ? <span>{profile.email}</span> : null}
              {profile?.npsn ? <span>NPSN {profile.npsn}</span> : null}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">Tautan</p>
            <Link className="block text-muted-foreground hover:text-emerald-600" href="/ppdb">
              PPDB Online
            </Link>
            <Link className="block text-muted-foreground hover:text-emerald-600" href="/announcements">
              Pengumuman
            </Link>
            <Link className="block text-muted-foreground hover:text-emerald-600" href="/jobs">
              Lowongan Kerja
            </Link>
            <Link className="block text-muted-foreground hover:text-emerald-600" href="/login">
              Login Staf / Siswa
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              NexAdmin
            </p>
            <p className="text-muted-foreground">Platform manajemen sekolah enterprise oleh NexSMSID.</p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} NexSMSID</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
