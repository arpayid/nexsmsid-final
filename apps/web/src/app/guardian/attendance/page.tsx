"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { ChildSelector } from "@/components/child-selector";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Attendance = {
  status: string;
  note?: string | null;
  session: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    topic?: string | null;
    schedule?: { teachingAssignment?: { subject?: { name: string } } | null; lessonHour?: { name: string } | null } | null;
  };
};

type AttendanceData = {
  summary: Record<string, number>;
  total: number;
  records: Attendance[];
};

const STATUS_LABEL: Record<string, string> = { PRESENT: "Hadir", ABSENT: "Alpha", LATE: "Terlambat", PERMIT: "Izin", SICK: "Sakit" };
const STATUS_VARIANT: Record<string, "success" | "outline" | "warning" | "secondary" | "outline"> = {
  PRESENT: "success",
  ABSENT: "outline",
  LATE: "warning",
  PERMIT: "secondary",
  SICK: "outline",
};

export default function GuardianAttendancePage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [childId, setChildId] = useState<string | null>(null);

  const loadAttendance = useCallback(
    () => api.getGuardianPortalChildAttendance(childId as string, { limit: 50 }) as Promise<AttendanceData>,
    [api, childId],
  );
  const { data, error, loading } = useApiQuery(loadAttendance, [api, childId], { enabled: Boolean(childId) });
  const items = data?.records ?? [];
  const summary = data?.summary ?? {};
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Wali", "Presensi"]}
        description="Riwayat presensi anak yang Anda pilih"
        eyebrow="Portal Wali"
        title="Presensi Anak"
      />
      <ChildSelector onChange={setChildId} />
      {!childId ? (
        <EmptyState description="Pilih anak terlebih dahulu." title="Pilih anak" />
      ) : loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorState message={error} title="Gagal memuat presensi" />
      ) : items.length === 0 ? (
        <EmptyState description="Belum ada data presensi untuk anak ini." title="Belum ada presensi" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            {Object.keys(STATUS_LABEL).map((key) => (
              <div className="rounded-lg border border-border bg-card p-4 text-center" key={key}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{STATUS_LABEL[key]}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{summary[key] ?? 0}</p>
              </div>
            ))}
          </div>
          <SectionCard description={`${total} catatan`} title="Riwayat Presensi">
            <ul className="divide-y divide-border">
              {items.map((r) => (
                <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={r.session.id}>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      {r.session.schedule?.teachingAssignment?.subject?.name ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.session.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      • {r.session.startTime}–{r.session.endTime}
                    </p>
                    {r.note ? <p className="mt-1 text-xs text-muted-foreground">Catatan: {r.note}</p> : null}
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
}
