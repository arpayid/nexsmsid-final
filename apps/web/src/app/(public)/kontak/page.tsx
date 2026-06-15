import type { Metadata } from "next";
import Link from "next/link";

import type { SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Button, Card } from "@nexsmsid/ui";

import { fetchPublicApi } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  return { title: `Kontak — ${profile?.name ?? "Sekolah"}` };
}

export default async function KontakPage() {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">Hubungi Kami</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Kontak Sekolah</h1>
      <p className="mt-4 text-muted-foreground">Informasi resmi untuk calon siswa, orang tua, dan mitra industri.</p>

      <div className="mt-10 grid gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Alamat</p>
          <p className="mt-1 font-medium">{profile?.address ?? "Belum diisi di profil sekolah"}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Telepon</p>
          <p className="mt-1 font-medium">{profile?.phone ?? "—"}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="mt-1 font-medium">{profile?.email ?? "—"}</p>
        </Card>
        {profile?.website ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Website</p>
            <a className="mt-1 block font-medium text-primary hover:underline" href={profile.website} rel="noreferrer" target="_blank">
              {profile.website}
            </a>
          </Card>
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/ppdb">Informasi PPDB</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Login Portal</Link>
        </Button>
      </div>
    </div>
  );
}
