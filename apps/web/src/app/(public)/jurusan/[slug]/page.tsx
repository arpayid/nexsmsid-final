import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { PublicCompetency, SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Button, Card } from "@nexsmsid/ui";

import { competencySlug, findCompetencyBySlug } from "@/lib/public-site";
import { fetchPublicApi } from "@/lib/public-api";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const competencies = (await fetchPublicApi<PublicCompetency[]>("/public/competencies")) ?? [];
  const item = findCompetencyBySlug(competencies, slug);
  return { title: item ? `${item.name} — Program Keahlian` : "Jurusan tidak ditemukan" };
}

export default async function JurusanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [competencies, profile] = await Promise.all([
    fetchPublicApi<PublicCompetency[]>("/public/competencies"),
    fetchPublicApi<SchoolProfile>("/public/school-profile"),
  ]);
  const item = findCompetencyBySlug(competencies ?? [], slug);
  if (!item) notFound();

  const registerHref = `/ppdb/register?competency=${encodeURIComponent(item.id)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">{item.department.name}</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{item.name}</h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">Kode kompetensi: {item.code}</p>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        {item.description ??
          `Program keahlian ${item.name} di ${profile?.name ?? "sekolah kami"} menekankan kompetensi praktik dan kesiapan industri.`}
      </p>

      <Card className="mt-10 p-6">
        <h2 className="text-lg font-semibold">Prospek Lulusan</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
          <li>Siap bekerja sesuai bidang keahlian setelah lulus atau PKL.</li>
          <li>Peluang melanjutkan ke perguruan tinggi vokasi atau universitas.</li>
          <li>Akses ke jaringan mitra industri melalui program PKL dan BKK sekolah.</li>
        </ul>
      </Card>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={registerHref}>Daftar Jurusan Ini</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/jurusan">Kembali ke Daftar Jurusan</Link>
        </Button>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const competencies = (await fetchPublicApi<PublicCompetency[]>("/public/competencies")) ?? [];
  return competencies.map((item) => ({ slug: competencySlug(item.code) }));
}
