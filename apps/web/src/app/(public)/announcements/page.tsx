"use client";

import { useCallback, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";

import { Badge, Card, EmptyState } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Row = Record<string, unknown>;

export default function AnnouncementsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadAnnouncements = useCallback(async () => {
    const response = await api.publicAnnouncements({ limit: 50 });
    return response.items;
  }, [api]);
  const { data: itemsData, error, loading } = useApiQuery<Row[]>(loadAnnouncements, [api]);
  const items = itemsData ?? [];

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="text-center">
          <Badge className="mb-5" variant="secondary">
            <Bell className="mr-2 h-3.5 w-3.5" /> Informasi Sekolah
          </Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">Pengumuman Sekolah</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">Informasi resmi terbaru yang sudah dipublikasikan oleh sekolah.</p>
        </div>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>
        ) : null}
        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length ? (
          <div className="grid gap-5">
            {items.map((item) => (
              <Card className="p-6" key={item.id as string}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{String(item.title ?? "Pengumuman")}</h2>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {String(item.publishAt ?? "").slice(0, 10) || "Tanggal publikasi"}
                    </p>
                  </div>
                  <Badge variant="success">{String(item.audience ?? "ALL")}</Badge>
                </div>
                <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">{String(item.content ?? "-")}</p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada pengumuman" description="Pengumuman yang dipublikasikan akan tampil di sini." />
        )}
      </div>
    </div>
  );
}
