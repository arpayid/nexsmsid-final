import { ArrowRight, BriefcaseBusiness, CalendarDays, GraduationCap, MapPin, Newspaper, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import type {
  AnnouncementRecord,
  PublicCompetency,
  PublicPartner,
  PublicPpdbOverview,
  PublicSchoolStats,
  SchoolProfile,
} from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, StatCard } from "@nexsmsid/ui";

import { competencySlug, daysUntil, formatDateId } from "@/lib/public-site";
import { fetchPublicApi } from "@/lib/public-api";
import { serializeJsonLd } from "@/lib/safe-json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  const name = profile?.name ?? "Sekolah Menengah Kejuruan";
  return {
    title: `${name} — Beranda`,
    description: profile?.description ?? `Website resmi ${name}. Informasi jurusan, PPDB, pengumuman, dan BKK.`,
    openGraph: {
      title: `${name} — Beranda`,
      description: profile?.description ?? undefined,
      siteName: name,
    },
  };
}

export default async function HomePage() {
  const [profile, stats, competencies, ppdb, announcements, partners] = await Promise.all([
    fetchPublicApi<SchoolProfile>("/public/school-profile"),
    fetchPublicApi<PublicSchoolStats>("/public/school-stats"),
    fetchPublicApi<PublicCompetency[]>("/public/competencies"),
    fetchPublicApi<PublicPpdbOverview | null>("/public/ppdb/overview"),
    fetchPublicApi<AnnouncementRecord[]>("/public/announcements?limit=3"),
    fetchPublicApi<PublicPartner[]>("/public/partners"),
  ]);

  const schoolName = profile?.name ?? "Sekolah Menengah Kejuruan";
  const featuredPrograms = (competencies ?? []).slice(0, 6);
  const latestNews = announcements ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: schoolName,
    description: profile?.description ?? undefined,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
    logo: profile?.logoUrl ?? undefined,
    address: profile?.address ?? undefined,
    telephone: profile?.phone ?? undefined,
    email: profile?.email ?? undefined,
    numberOfStudents: stats?.activeStudents ?? undefined,
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} type="application/ld+json" />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-grid-soft opacity-40" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge variant="secondary">{profile?.npsn ? `NPSN ${profile.npsn}` : "SMK Terakreditasi"}</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{schoolName}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {profile?.description ??
                "Membentuk lulusan kompeten, berkarakter, dan siap bersaing di dunia industri melalui pendidikan kejuruan berbasis link and match."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/ppdb/register">
                  Daftar PPDB <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/jurusan">Lihat Jurusan</Link>
              </Button>
            </div>
            {profile?.principalName ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Kepala Sekolah: <span className="font-medium text-foreground">{profile.principalName}</span>
              </p>
            ) : null}
          </div>

          <Card className="surface-panel overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                Ringkasan Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-muted p-4">
                <p className="text-sm text-muted-foreground">Siswa Aktif</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.activeStudents ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">Program Keahlian</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{stats?.totalPrograms ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-muted p-4">
                <p className="text-sm text-muted-foreground">Guru & Staf</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.totalTeachers ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-muted p-4">
                <p className="text-sm text-muted-foreground">Mitra Industri</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.totalPartners ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {stats ? (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              description="siswa terdaftar aktif"
              icon={<UsersRound className="h-5 w-5" />}
              title="Siswa Aktif"
              tone="violet"
              value={String(stats.activeStudents)}
            />
            <StatCard
              description="pendidik & tenaga kependidikan"
              icon={<GraduationCap className="h-5 w-5" />}
              title="Guru & Staf"
              tone="blue"
              value={String(stats.totalTeachers)}
            />
            <StatCard
              description="program keahlian aktif"
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              title="Program Keahlian"
              tone="emerald"
              value={String(stats.totalPrograms)}
            />
            <StatCard
              description="mitra PKL & rekrutmen"
              icon={<MapPin className="h-5 w-5" />}
              title="Mitra Industri"
              tone="amber"
              value={String(stats.totalPartners)}
            />
          </div>
        </section>
      ) : null}

      <section className="px-4 py-16 sm:px-6 lg:px-8" id="jurusan">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline">Program Keahlian</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Jurusan yang tersedia</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">Data jurusan diambil langsung dari master data sekolah.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/jurusan">Semua Jurusan</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.length ? (
              featuredPrograms.map((program) => (
                <Link href={`/jurusan/${competencySlug(program.code)}`} key={program.id}>
                  <Card className="h-full transition-shadow hover:shadow-elevated">
                    <CardHeader>
                      <Badge variant="secondary">{program.department.name}</Badge>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {program.description ?? "Program keahlian siap kerja dengan kurikulum berbasis industri."}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-6 md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">Belum ada data program keahlian yang dipublikasikan.</p>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="bg-card px-4 py-16 sm:px-6 lg:px-8" id="ppdb">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-sidebar p-8 text-sidebar-foreground shadow-elevated sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="border-sidebar-border bg-white/10 text-sidebar-foreground">PPDB Online</Badge>
              {ppdb ? (
                <>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">{ppdb.name}</h2>
                  <p className="mt-3 text-sidebar-muted">
                    {formatDateId(ppdb.startDate)} — {formatDateId(ppdb.endDate)}
                    {ppdb.academicYear ? ` · ${ppdb.academicYear.name}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-sidebar-muted">{daysUntil(ppdb.endDate)} hari lagi hingga penutupan.</p>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">PPDB belum dibuka</h2>
                  <p className="mt-3 text-sidebar-muted">Pantau halaman ini untuk informasi gelombang pendaftaran berikutnya.</p>
                </>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild disabled={!ppdb} size="lg" variant="secondary">
                  <Link href="/ppdb/register">Mulai Pendaftaran</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-sidebar-foreground hover:bg-white/10">
                  <Link href="/ppdb/status">Cek Status Pendaftaran</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-sidebar-border bg-white/5 p-6">
              {ppdb ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Kuota Terisi</p>
                      <p className="text-sm text-sidebar-muted">
                        {ppdb.registeredCount}
                        {ppdb.quota ? ` dari ${ppdb.quota} pendaftar` : " pendaftar"}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold">{ppdb.fillPercent != null ? `${ppdb.fillPercent}%` : "—"}</span>
                  </div>
                  {ppdb.fillPercent != null ? (
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-sidebar-accent" style={{ width: `${ppdb.fillPercent}%` }} />
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-sidebar-muted">Statistik pendaftaran akan tampil saat periode PPDB aktif.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8" id="agenda">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline">Berita & Pengumuman</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Informasi terbaru</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/announcements">Lihat Semua</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {latestNews.length ? (
              latestNews.map((item) => (
                <Card key={item.id as string}>
                  <CardHeader>
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Newspaper className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">Pengumuman</Badge>
                    <CardTitle className="text-lg">
                      <Link className="hover:text-primary" href={`/announcements/${item.id}`}>
                        {String(item.title ?? "Pengumuman")}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium text-primary">{formatDateId(String(item.publishAt ?? ""))}</p>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">{String(item.content ?? "")}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6 md:col-span-3">
                <p className="text-sm text-muted-foreground">Belum ada pengumuman yang dipublikasikan.</p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {(partners ?? []).length ? (
        <section className="border-t border-border bg-surface-muted px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-semibold">Mitra Industri</h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
              Kolaborasi dengan dunia industri untuk PKL, sertifikasi, dan penempatan kerja.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {(partners ?? []).slice(0, 12).map((partner) => (
                <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium" key={partner.id}>
                  {partner.name}
                </span>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button asChild variant="outline">
                <Link href="/mitra">Lihat Semua Mitra</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
