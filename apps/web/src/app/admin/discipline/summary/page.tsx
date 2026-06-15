"use client";

import { FormEvent, useMemo, useState } from "react";
import { FileDown, Loader2, Search } from "lucide-react";

import { Button, DataTable, ErrorState, Input, PageHeader, SectionCard, StatusBadge } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";

type StudentRef = { id?: string; name?: string };

type ViolationRow = {
  id?: string;
  incidentDate?: string;
  rule?: { name?: string };
  status?: string;
  point?: number;
};

type AchievementRow = {
  id?: string;
  awardedAt?: string;
  title?: string;
  category?: string;
  point?: number;
};

type StudentSummary = {
  achievementCount?: number;
  latestAchievements?: AchievementRow[];
  latestViolations?: ViolationRow[];
  netPoints?: number;
  student?: StudentRef;
  totalAchievementPoints?: number;
  totalViolationPoints?: number;
  violationCount?: number;
};

type ClassroomRow = {
  student?: StudentRef;
  totalViolationPoints?: number;
  totalAchievementPoints?: number;
  netPoints?: number;
  violationCount?: number;
  achievementCount?: number;
};

type ClassroomSummary = {
  classroom?: { name?: string };
  rows?: ClassroomRow[];
  totals?: Record<string, number>;
};

export default function DisciplineSummaryPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [studentId, setStudentId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
  const [classroomSummary, setClassroomSummary] = useState<ClassroomSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStudent(event?: FormEvent) {
    event?.preventDefault();
    if (!studentId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setStudentSummary((await api.getStudentDisciplineSummary(studentId.trim())) as StudentSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat ringkasan siswa");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassroom(event?: FormEvent) {
    event?.preventDefault();
    if (!classroomId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setClassroomSummary((await api.getClassroomDisciplineSummary(classroomId.trim())) as ClassroomSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat ringkasan kelas");
    } finally {
      setLoading(false);
    }
  }

  async function printStudentSummary() {
    if (!studentId.trim()) return;
    const blob = await api.downloadStudentDisciplineSummaryPdf(studentId.trim());
    api.savePdfBlob(blob, `discipline-summary-${studentId.trim()}.pdf`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "BK & Kedisiplinan", "Ringkasan"]}
        description="Ringkasan dihitung dinamis dari pelanggaran CONFIRMED dan prestasi non-deleted."
        eyebrow="Discipline"
        title="Ringkasan Disiplin"
      />

      {error ? <ErrorState message={error} title="Gagal memuat ringkasan" /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard description="Cari siswa untuk melihat detail." title="Ringkasan Siswa">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={loadStudent}>
            <EntityPicker entityType="student" name="studentId" onChange={setStudentId} placeholder="Cari siswa..." value={studentId} />
            <Button disabled={loading} type="submit">
              <Search className="h-4 w-4" /> Cari
            </Button>
            <Button disabled={!studentSummary} onClick={printStudentSummary} type="button" variant="outline">
              <FileDown className="h-4 w-4" /> Print
            </Button>
          </form>
        </SectionCard>
        <SectionCard description="Cari kelas untuk rekap per siswa." title="Ringkasan Kelas">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={loadClassroom}>
            <EntityPicker
              entityType="classroom"
              name="classroomId"
              onChange={setClassroomId}
              placeholder="Cari kelas..."
              value={classroomId}
            />
            <Button disabled={loading} type="submit">
              <Search className="h-4 w-4" /> Cari
            </Button>
          </form>
        </SectionCard>
      </div>

      {loading ? (
        <div className="grid min-h-40 place-items-center rounded-xl bg-card shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}

      {studentSummary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Poin Pelanggaran" value={studentSummary.totalViolationPoints ?? 0} />
            <MetricCard label="Poin Prestasi" value={studentSummary.totalAchievementPoints ?? 0} />
            <MetricCard label="Saldo Poin" value={studentSummary.netPoints ?? 0} />
            <MetricCard label="Total Catatan" value={(studentSummary.violationCount ?? 0) + (studentSummary.achievementCount ?? 0)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard description={studentSummary.student?.name ?? "-"} title="Pelanggaran Terbaru">
              <DataTable
                columns={[
                  { key: "incidentDate", header: "Tanggal", cell: (row) => formatDate(row.incidentDate) },
                  { key: "rule", header: "Aturan", cell: (row) => row.rule?.name ?? "-" },
                  { key: "status", header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
                  { key: "point", header: "Poin" },
                ]}
                data={studentSummary.latestViolations ?? []}
                getRowId={(row, index) => String(row.id ?? index)}
                minWidth="min-w-[620px]"
              />
            </SectionCard>
            <SectionCard description={studentSummary.student?.name ?? "-"} title="Prestasi Terbaru">
              <DataTable
                columns={[
                  { key: "awardedAt", header: "Tanggal", cell: (row) => formatDate(row.awardedAt) },
                  { key: "title", header: "Prestasi" },
                  { key: "category", header: "Kategori" },
                  { key: "point", header: "Poin" },
                ]}
                data={studentSummary.latestAchievements ?? []}
                getRowId={(row, index) => String(row.id ?? index)}
                minWidth="min-w-[620px]"
              />
            </SectionCard>
          </div>
        </>
      ) : null}

      {classroomSummary ? (
        <SectionCard description={classroomSummary.classroom?.name ?? "-"} title="Rekap Kelas">
          <DataTable
            columns={[
              { key: "student", header: "Siswa", cell: (row) => row.student?.name ?? "-" },
              { key: "totalViolationPoints", header: "Pelanggaran" },
              { key: "totalAchievementPoints", header: "Prestasi" },
              { key: "netPoints", header: "Saldo" },
              { key: "violationCount", header: "Jml Pelanggaran" },
              { key: "achievementCount", header: "Jml Prestasi" },
            ]}
            data={classroomSummary.rows ?? []}
            getRowId={(row, index) => String(row.student?.id ?? index)}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
