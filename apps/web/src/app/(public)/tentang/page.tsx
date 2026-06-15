import type { Metadata } from "next";
import Link from "next/link";

import type { SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@nexsmsid/ui";

import { parseVisionMission } from "@/lib/public-metadata";
import { fetchPublicApi } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  return { title: `Tentang — ${profile?.name ?? "Sekolah"}` };
}

export default async function TentangPage() {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  const { vision, mission } = parseVisionMission(profile?.description);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">Profil Sekolah</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{profile?.name ?? "Tentang Sekolah"}</h1>
      {!vision && !mission && profile?.description ? (
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{profile.description}</p>
      ) : (
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {profile?.address ?? "Informasi profil sekolah untuk calon siswa dan masyarakat."}
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Kepala Sekolah</p>
          <p className="mt-1 font-semibold">{profile?.principalName ?? "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">NPSN</p>
          <p className="mt-1 font-semibold">{profile?.npsn ?? "—"}</p>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Visi & Misi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-7 text-muted-foreground">
          <div>
            <h3 className="text-base font-semibold text-foreground">Visi</h3>
            <p className="mt-2">
              {vision ?? 'Visi sekolah belum diisi. Admin dapat menambahkan teks dengan format "Visi: ..." pada deskripsi profil sekolah.'}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Misi</h3>
            <p className="mt-2">
              {mission ?? 'Misi sekolah belum diisi. Admin dapat menambahkan teks dengan format "Misi: ..." pada deskripsi profil sekolah.'}
            </p>
          </div>
          <div>
            <Link className="text-sm font-medium text-primary hover:underline" href="/jurusan">
              Lihat program keahlian →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
