import { ArrowRight, CheckCircle2, FileText, GraduationCap, School } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import type { PublicPpdbOverview, SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Button, Card } from "@nexsmsid/ui";

import { daysUntil, formatDateId } from "@/lib/public-site";
import { fetchPublicApi } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  return { title: `PPDB Online — ${profile?.name ?? "Sekolah"}` };
}

export default async function PpdbLandingPage() {
  const ppdb = await fetchPublicApi<PublicPpdbOverview | null>("/public/ppdb/overview");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge className="mb-4" variant="secondary">
          <GraduationCap className="mr-2 h-3.5 w-3.5" /> PPDB Online
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Penerimaan Peserta Didik Baru</h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Pendaftaran dilakukan secara daring. Lengkapi data, pilih jurusan, dan pantau status seleksi.
        </p>
      </div>

      <Card className="mt-10 p-6">
        {ppdb ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{ppdb.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateId(ppdb.startDate)} — {formatDateId(ppdb.endDate)}
                </p>
              </div>
              <Badge variant="success">Sedang Dibuka · {daysUntil(ppdb.endDate)} hari lagi</Badge>
            </div>
            {ppdb.quota ? (
              <div>
                <div className="flex justify-between text-sm">
                  <span>Kuota terisi</span>
                  <span className="font-medium">
                    {ppdb.registeredCount} / {ppdb.quota} ({ppdb.fillPercent}%)
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${ppdb.fillPercent ?? 0}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{ppdb.registeredCount} pendaftar terdaftar.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada periode PPDB yang aktif saat ini.</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild disabled={!ppdb} size="lg">
            <Link href="/ppdb/register">
              Daftar Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/ppdb/status">Cek Status Pendaftaran</Link>
          </Button>
        </div>
      </Card>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { icon: FileText, title: "Isi Data Diri", desc: "Lengkapi data pribadi dan pilih jurusan." },
          { icon: School, title: "Upload Dokumen", desc: "Unggah berkas persyaratan melalui halaman cek status." },
          { icon: CheckCircle2, title: "Pantau Status", desc: "Cek progres seleksi dengan nomor registrasi." },
        ].map((step) => (
          <Card className="p-5 text-center" key={step.title}>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
