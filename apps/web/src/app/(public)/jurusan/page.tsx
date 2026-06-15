import type { Metadata } from "next";
import Link from "next/link";

import type { PublicCompetency, SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@nexsmsid/ui";

import { competencySlug } from "@/lib/public-site";
import { fetchPublicApi } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  return { title: `Program Keahlian — ${profile?.name ?? "Sekolah"}` };
}

export default async function JurusanPage() {
  const competencies = (await fetchPublicApi<PublicCompetency[]>("/public/competencies")) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">Program Keahlian</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Jurusan & Kompetensi Keahlian</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Pilih jurusan yang sesuai minat Anda. Setiap program dirancang untuk mempersiapkan siswa memasuki dunia kerja atau melanjutkan
        pendidikan.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {competencies.map((item) => (
          <Link href={`/jurusan/${competencySlug(item.code)}`} key={item.id}>
            <Card className="h-full hover:shadow-elevated">
              <CardHeader>
                <Badge variant="outline">{item.department.name}</Badge>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description ?? "Kurikulum berbasis kompetensi industri."}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">Kode {item.code}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!competencies.length ? (
        <Card className="mt-8 p-6">
          <p className="text-sm text-muted-foreground">Belum ada data jurusan yang aktif.</p>
        </Card>
      ) : null}
    </div>
  );
}
