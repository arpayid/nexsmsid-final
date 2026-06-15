"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Download, FileText, Loader2, Filter, CheckCircle2, Clock } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, StatCard, Badge } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { getReportFilterLabel, ReportFilterField } from "@/components/report-filter-field";

interface ReportType {
  code: string;
  name: string;
  category: string;
  supportedFormats: string[];
  requiredFilters: string[];
  optionalFilters: string[];
}

type MasterDataOption = { id: string; name?: string; code?: string };

type ReportJobRow = {
  id: string;
  title?: string | null;
  type?: string;
  status: string;
  createdAt: string;
};

type ReportSummary = {
  jobs?: { total?: number; completed?: number; pending?: number };
  exports?: { total?: number };
  recentJobs?: ReportJobRow[];
};

type ReportPageData = {
  summary: ReportSummary;
  reportTypes: ReportType[];
  academicYears: MasterDataOption[];
  semesters: MasterDataOption[];
  classrooms: MasterDataOption[];
};

export default function AdminReportsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReportData = useCallback(async () => {
    const [summaryData, types, ay, sem, cls] = await Promise.all([
      api.getReportSummary(),
      api.listReportTypes(),
      api.masterDataList("academic-years"),
      api.masterDataList("semesters"),
      api.masterDataList("classrooms"),
    ]);
    return {
      summary: summaryData,
      reportTypes: types as ReportType[],
      academicYears: ay.data || [],
      semesters: sem.data || [],
      classrooms: cls.data || [],
    };
  }, [api]);
  const { data, error: fetchError, loading, refetch } = useApiQuery<ReportPageData>(loadReportData, [api]);
  const error = actionError ?? fetchError;
  const summary = data?.summary;
  const reportTypes = data?.reportTypes ?? [];
  const academicYears = data?.academicYears ?? [];
  const semesters = data?.semesters ?? [];
  const classrooms = data?.classrooms ?? [];

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedReport) return;

    const formData = new FormData(event.currentTarget);
    const filters: Record<string, FormDataEntryValue> = {};

    // Extract filters based on report definition
    const allFilters = [...selectedReport.requiredFilters, ...selectedReport.optionalFilters];
    allFilters.forEach((f) => {
      const val = formData.get(f);
      if (val) filters[f] = val;
    });

    setSubmitting(true);
    setActionError(null);
    try {
      await api.generateReport({
        type: selectedReport.code,
        format: formData.get("format"),
        title: formData.get("title"),
        parameters: filters,
      });
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal generate laporan");
    } finally {
      setSubmitting(false);
    }
  }

  const jobs = summary?.jobs;
  const exportsData = summary?.exports;

  const categories = Array.from(new Set(reportTypes.map((r) => r.category)));

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        breadcrumb={["Admin", "Laporan"]}
        description="Pusat pelaporan sistem NexSMSID. Generate laporan akademik, keuangan, dan lainnya."
        eyebrow="Laporan"
        title="Report Center"
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
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Job"
              value={String(jobs?.total ?? 0)}
              description="Semua report job"
              icon={<BarChart3 className="h-5 w-5" />}
              tone="violet"
            />
            <StatCard
              title="Completed"
              value={String(jobs?.completed ?? 0)}
              description="Job berhasil"
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="Pending"
              value={String(jobs?.pending ?? 0)}
              description="Dalam antrian"
              icon={<Clock className="h-5 w-5" />}
              tone="blue"
            />
            <StatCard
              title="Export"
              value={String(exportsData?.total ?? 0)}
              description="Riwayat export"
              icon={<Download className="h-5 w-5" />}
              tone="violet"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pilih Laporan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {categories.map((cat) => (
                      <div key={cat} className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{cat}</h3>
                        <div className="flex flex-col gap-2">
                          {reportTypes
                            .filter((r) => r.category === cat)
                            .map((report) => (
                              <button
                                key={report.code}
                                onClick={() => setSelectedReport(report)}
                                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                                  selectedReport?.code === report.code
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                                }`}
                              >
                                <span
                                  className={`text-sm font-bold ${selectedReport?.code === report.code ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  {report.name}
                                </span>
                                <div className="mt-2 flex gap-1">
                                  {report.supportedFormats.map((f) => (
                                    <Badge key={f} variant="outline" className="text-[10px] py-0 px-1">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {selectedReport ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Filter Laporan</CardTitle>
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-4">
                      <div className="rounded-xl bg-card p-4 border border-primary/10 space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Konfigurasi Laporan</p>

                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-muted-foreground">Nama Laporan</span>
                          <Input
                            name="title"
                            defaultValue={`${selectedReport.name} - ${new Date().toLocaleDateString("id-ID")}`}
                            placeholder="Judul custom"
                          />
                        </label>

                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-muted-foreground">Format Output</span>
                          <select
                            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground"
                            name="format"
                            required
                          >
                            {selectedReport.supportedFormats.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="rounded-xl bg-card p-4 border border-primary/10 space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Filter Data</p>

                        {[...new Set([...selectedReport.requiredFilters, ...selectedReport.optionalFilters])].map((filterKey) => {
                          if (
                            filterKey === "endDate" &&
                            selectedReport.requiredFilters.concat(selectedReport.optionalFilters).includes("startDate")
                          ) {
                            return null;
                          }

                          if (filterKey === "startDate") {
                            const hasEndDate = [...selectedReport.requiredFilters, ...selectedReport.optionalFilters].includes("endDate");
                            if (hasEndDate) {
                              return (
                                <div className="grid grid-cols-2 gap-3" key="date-range">
                                  <ReportFilterField
                                    filterKey="startDate"
                                    label={getReportFilterLabel("startDate")}
                                    required={selectedReport.requiredFilters.includes("startDate")}
                                  />
                                  <ReportFilterField
                                    filterKey="endDate"
                                    label={getReportFilterLabel("endDate")}
                                    required={selectedReport.requiredFilters.includes("endDate")}
                                  />
                                </div>
                              );
                            }
                          }

                          const optionMap: Record<string, Array<{ id: string; name?: string; code?: string }>> = {
                            academicYearId: academicYears,
                            semesterId: semesters,
                            classroomId: classrooms,
                          };

                          return (
                            <ReportFilterField
                              filterKey={filterKey}
                              key={filterKey}
                              label={getReportFilterLabel(filterKey)}
                              options={optionMap[filterKey]}
                              required={selectedReport.requiredFilters.includes(filterKey)}
                            />
                          );
                        })}
                      </div>

                      <Button className="w-full" disabled={submitting} type="submit" size="lg">
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Generate Laporan
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted p-8 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground">Belum Ada Laporan Terpilih</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih salah satu laporan di sebelah kiri untuk mengatur filter dan generate.
                  </p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Recent Jobs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {summary?.recentJobs?.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-muted-foreground truncate max-w-[150px]">{job.title || job.type}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(job.createdAt).toLocaleString("id-ID")}</p>
                        </div>
                        <Badge variant={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "warning" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                    {!summary?.recentJobs?.length && (
                      <div className="p-8 text-center text-xs text-muted-foreground">Belum ada riwayat job terbaru.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
