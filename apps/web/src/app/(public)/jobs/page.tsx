"use client";

import { useCallback, useMemo } from "react";
import { ArrowRight, BriefcaseBusiness, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge, Button, Card, EmptyState } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Row = Record<string, unknown>;

export default function JobsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadJobs = useCallback(async () => {
    const response = await api.publicJobs({ limit: 50 });
    return response.items;
  }, [api]);
  const { data: itemsData, error, loading } = useApiQuery<Row[]>(loadJobs, [api]);
  const items = itemsData ?? [];

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center">
          <Badge className="mb-5" variant="secondary">
            <BriefcaseBusiness className="mr-2 h-3.5 w-3.5" /> BKK Online
          </Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">Lowongan Kerja Alumni</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Temukan peluang karier dari mitra industri sekolah dan kirim lamaran secara daring.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>
        ) : null}
        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((job) => (
              <Card className="p-6" key={job.id as string}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{String(job.title ?? "Lowongan")}</h2>
                    <p className="mt-1 font-semibold text-primary">{String(job.companyName ?? "-")}</p>
                  </div>
                  <Badge variant="success">PUBLISHED</Badge>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{String(job.description ?? "-")}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {String(job.location ?? "Lokasi fleksibel")}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button asChild variant="soft">
                    <Link href={`/jobs/${job.id}`}>
                      Lihat Detail <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada lowongan" description="Lowongan yang dipublikasikan akan muncul di sini." />
        )}
      </div>
    </div>
  );
}
