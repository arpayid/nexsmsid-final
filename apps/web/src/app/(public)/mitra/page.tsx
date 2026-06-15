import type { Metadata } from "next";
import Link from "next/link";

import type { PublicPartner, SchoolProfile } from "@nexsmsid/api-client";
import { Badge, Card } from "@nexsmsid/ui";

import { fetchPublicApi } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  return { title: `Mitra Industri — ${profile?.name ?? "Sekolah"}` };
}

export default async function MitraPage() {
  const partners = (await fetchPublicApi<PublicPartner[]>("/public/partners")) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">Link & Match</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Mitra Industri</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Jaringan mitra yang mendukung program PKL, sertifikasi kompetensi, dan penempatan kerja lulusan.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {partners.map((partner) => (
          <Card className="p-6" key={partner.id}>
            <h2 className="text-lg font-semibold">{partner.name}</h2>
            {partner.type ? <p className="mt-1 text-sm text-primary">{partner.type}</p> : null}
            {partner.address ? <p className="mt-3 text-sm text-muted-foreground">{partner.address}</p> : null}
            {partner.website ? (
              <a
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                href={partner.website}
                rel="noreferrer"
                target="_blank"
              >
                Kunjungi website
              </a>
            ) : null}
          </Card>
        ))}
      </div>

      {!partners.length ? (
        <Card className="mt-8 p-6">
          <p className="text-sm text-muted-foreground">Data mitra industri belum dipublikasikan.</p>
        </Card>
      ) : null}

      <div className="mt-10">
        <Link className="text-sm font-medium text-primary hover:underline" href="/jobs">
          Lihat lowongan kerja dari mitra →
        </Link>
      </div>
    </div>
  );
}
