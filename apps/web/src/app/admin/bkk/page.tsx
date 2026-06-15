"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, BriefcaseBusiness, Building2, FileText, Loader2, Users } from "lucide-react";

import { Card, CardContent, PageHeader, StatCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function BkkDashboardPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.getBkkSummary() as Promise<Record<string, unknown>>, [api]);
  const { data, error, loading } = useApiQuery<Record<string, unknown>>(loadSummary, [api]);

  const jobs = data?.jobs as Record<string, unknown> | undefined;
  const internships = data?.internships as Record<string, unknown> | undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "BKK"]}
        description="Ringkasan alumni, lowongan, lamaran, tracer study, dan PKL."
        eyebrow="BKK"
        title="Dashboard BKK"
      />
      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}
      {loading ? (
        <Card>
          <CardContent>
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Mitra Aktif"
            value={String(data?.partners ?? 0)}
            description="Industry partner aktif"
            icon={<Building2 className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            title="Alumni"
            value={String(data?.alumni ?? 0)}
            description="Total alumni terdaftar"
            icon={<Users className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Lamaran"
            value={String(data?.applications ?? 0)}
            description="Total lamaran kerja"
            icon={<FileText className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            title="Lowongan Published"
            value={String(jobs?.published ?? 0)}
            description="Lowongan publik aktif"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            title="PKL Ongoing"
            value={String(internships?.ongoing ?? 0)}
            description="PKL sedang berjalan"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Tracer Study"
            value={String(data?.tracerStudies ?? 0)}
            description="Data tracer terkumpul"
            icon={<FileText className="h-5 w-5" />}
            tone="emerald"
          />
        </div>
      )}
    </div>
  );
}
