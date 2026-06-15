"use client";

import { useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge, Button, Card } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Row = Record<string, unknown>;

export function JobDetailClient({ id }: { id: string }) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadJob = useCallback(() => api.publicJob(id), [api, id]);
  const { data: job, error, loading } = useApiQuery<Row>(loadJob, [api, id]);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Button asChild variant="ghost">
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-6 text-sm font-bold text-rose-700">{error}</Card>
        ) : job ? (
          <Card className="p-8">
            <Badge className="mb-5" variant="secondary">
              <BriefcaseBusiness className="mr-2 h-3.5 w-3.5" /> Lowongan BKK
            </Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground">{String(job.title ?? "Lowongan")}</h1>
            <p className="mt-2 text-lg font-bold text-primary">{String(job.companyName ?? "-")}</p>
            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <MapPin className="h-4 w-4" /> {String(job.location ?? "Lokasi fleksibel")}
            </p>
            <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="mb-2 font-semibold text-foreground">Deskripsi</h2>
                <p>{String(job.description ?? "-")}</p>
              </section>
              <section>
                <h2 className="mb-2 font-semibold text-foreground">Kualifikasi</h2>
                <p>{String(job.qualification ?? "-")}</p>
              </section>
              <section>
                <h2 className="mb-2 font-semibold text-foreground">Informasi</h2>
                <p>
                  Tipe: {String(job.employmentType ?? "-")} | Gaji: {String(job.salaryRange ?? "-")} | Deadline:{" "}
                  {String(job.deadline ?? "-").slice(0, 10)}
                </p>
              </section>
            </div>
            <div className="mt-8 flex justify-end">
              <Button asChild>
                <Link href={`/jobs/${job.id}/apply`}>
                  Lamar Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
