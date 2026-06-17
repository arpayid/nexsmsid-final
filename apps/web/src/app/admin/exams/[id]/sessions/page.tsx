"use client";

import { ArrowLeft, CheckCircle2, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { ExamScheduleRecord, ExamSessionRecord } from "@nexsmsid/api-client";
import { Button, DataTable, ErrorState, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type SessionsData = {
  schedules: ExamScheduleRecord[];
  sessionsMap: Record<string, ExamSessionRecord[]>;
};

export default function ExamSessionsPage() {
  const { id } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [submitting, setSubmitting] = useState(false);

  const loadSessions = useCallback(async () => {
    const sched = await client.listExamSchedules(id);
    const map: Record<string, ExamSessionRecord[]> = {};
    await Promise.all(
      sched.map(async (s: ExamScheduleRecord) => {
        try {
          map[s.id] = await client.listExamSessions(s.id);
        } catch {
          map[s.id] = [];
        }
      }),
    );
    return { schedules: sched, sessionsMap: map };
  }, [client, id]);

  const { data, error, loading, refetch, setError } = useApiQuery<SessionsData>(loadSessions, [client, id]);
  const schedules = data?.schedules ?? [];
  const sessionsMap = data?.sessionsMap ?? {};

  async function handleCreate(scheduleId: string) {
    setSubmitting(true);
    try {
      await client.createExamSession(scheduleId, {});
      await refetch();
    } catch {
      setError("Gagal membuat sesi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(sessionId: string, status: string) {
    try {
      await client.updateExamSessionStatus(sessionId, status);
      await refetch();
    } catch {
      setError("Gagal memperbarui status sesi");
    }
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Memuat sesi...</div>;

  const sessionCols: DataTableColumn<ExamSessionRecord>[] = [
    { header: "Kode", key: "code" },
    { header: "Nama", key: "name", cell: (row) => row.name ?? "-" },
    { header: "Status", key: "status", cell: (row) => <StatusBadge value={row.status} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/exams/${id}`}>
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Sesi"]}
        description="Kelola sesi untuk setiap jadwal."
        title="Sesi Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      <div className="space-y-6">
        {schedules.length === 0 ? (
          <SectionCard title="Belum ada jadwal">
            <p className="py-4 text-center text-sm text-muted-foreground">Buat jadwal terlebih dahulu di menu Jadwal ujian.</p>
          </SectionCard>
        ) : (
          schedules.map((sched) => {
            const sessions = sessionsMap[sched.id] ?? [];
            const scheduleTitle = `${new Date(sched.date).toLocaleDateString("id-ID")} · ${sched.startTime}–${sched.endTime}`;

            return (
              <SectionCard
                action={
                  <Button disabled={submitting} onClick={() => void handleCreate(sched.id)} size="sm">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Buat Sesi
                  </Button>
                }
                description={sched.room?.name ?? "Tanpa ruangan"}
                key={sched.id}
                title={scheduleTitle}
              >
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada sesi untuk jadwal ini.</p>
                ) : (
                  <DataTable
                    actions={(row) => (
                      <div className="flex gap-2">
                        {row.status === "PENDING" ? (
                          <Button onClick={() => handleUpdateStatus(row.id, "ACTIVE")} size="sm" variant="outline">
                            <Play className="h-4 w-4" /> Mulai
                          </Button>
                        ) : null}
                        {row.status === "ACTIVE" ? (
                          <Button onClick={() => handleUpdateStatus(row.id, "COMPLETED")} size="sm" variant="outline">
                            <CheckCircle2 className="h-4 w-4" /> Selesai
                          </Button>
                        ) : null}
                      </div>
                    )}
                    columns={sessionCols}
                    data={sessions}
                    getRowId={(r) => r.id}
                    minWidth="min-w-[500px]"
                  />
                )}
              </SectionCard>
            );
          })
        )}
      </div>
    </div>
  );
}
