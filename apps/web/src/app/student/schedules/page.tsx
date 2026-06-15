"use client";

import { useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Schedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teachingAssignment?: { subject?: { name: string }; teacher?: { name: string } } | null;
  room?: { name: string } | null;
  lessonHour?: { name: string; order: number } | null;
};

const DAY_ORDER: Record<string, number> = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7 };
const DAY_LABEL: Record<string, string> = {
  MONDAY: "Senin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Kamis",
  FRIDAY: "Jumat",
  SATURDAY: "Sabtu",
  SUNDAY: "Minggu",
};

export default function StudentSchedulesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSchedules = useCallback(async () => {
    const data = (await api.getStudentPortalSchedules()) as Schedule[];
    return [...data].sort((a, b) => {
      const da = DAY_ORDER[a.dayOfWeek] ?? 99;
      const db = DAY_ORDER[b.dayOfWeek] ?? 99;
      if (da !== db) return da - db;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [api]);
  const { data: itemsData, error, loading } = useApiQuery(loadSchedules, [api]);
  const items = itemsData ?? [];

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error) return <ErrorState message={error} title="Gagal memuat jadwal" />;
  if (items.length === 0) return <EmptyState description="Belum ada jadwal untuk kelas Anda." title="Belum ada jadwal" />;

  const grouped = items.reduce<Record<string, Schedule[]>>((acc, item) => {
    if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Siswa", "Jadwal"]}
        description="Jadwal pelajaran mingguan"
        eyebrow="Portal Siswa"
        title="Jadwal Pelajaran"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.keys(grouped)
          .sort((a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99))
          .map((day) => (
            <SectionCard key={day} title={DAY_LABEL[day] ?? day}>
              <ul className="space-y-3">
                {grouped[day].map((s) => (
                  <li className="rounded-lg border border-border p-3" key={s.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{s.teachingAssignment?.subject?.name ?? "-"}</p>
                      <Badge variant="info">
                        {s.startTime}–{s.endTime}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.teachingAssignment?.teacher?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.room?.name ?? "-"} • {s.lessonHour?.name ?? "-"}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
      </div>
    </div>
  );
}
