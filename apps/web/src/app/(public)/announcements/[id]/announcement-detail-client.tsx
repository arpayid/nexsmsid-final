"use client";

import { useCallback, useMemo } from "react";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import Link from "next/link";

import { Badge, Button, Card } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { formatDateId } from "@/lib/public-site";

type Row = Record<string, unknown>;

export function AnnouncementDetailClient({ id }: { id: string }) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadAnnouncement = useCallback(() => api.publicAnnouncement(id) as Promise<Row>, [api, id]);
  const { data: item, error, loading } = useApiQuery(loadAnnouncement, [api, id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost">
        <Link href="/announcements">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Pengumuman
        </Link>
      </Button>

      {loading ? (
        <div className="mt-12 grid min-h-48 place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="mt-8 text-sm font-medium text-rose-600">{error}</p>
      ) : item ? (
        <Card className="mt-8 p-8">
          <Badge className="mb-4" variant="secondary">
            <Bell className="mr-2 h-3.5 w-3.5" /> Pengumuman
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{String(item.title ?? "Pengumuman")}</h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground">{formatDateId(String(item.publishAt ?? ""))}</p>
          <div className="mt-8 whitespace-pre-line leading-8 text-muted-foreground">{String(item.content ?? "")}</div>
        </Card>
      ) : null}
    </div>
  );
}
