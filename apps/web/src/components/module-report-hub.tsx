"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button, ErrorState, ModuleCard, PageHeader, SectionCard } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";

export type ModuleReportItem = {
  code: string;
  description?: string;
  format?: string;
  label: string;
};

type ModuleReportHubProps = {
  breadcrumb: string[];
  description: string;
  eyebrow: string;
  footer?: ReactNode;
  reports: ModuleReportItem[];
  title: string;
};

export function ModuleReportHub({ breadcrumb, description, eyebrow, footer, reports, title }: ModuleReportHubProps) {
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(report: ModuleReportItem) {
    setBusyCode(report.code);
    setError(null);
    setMessage(null);
    try {
      const api = createBrowserApiClient();
      await api.generateReport({
        type: report.code,
        format: report.format ?? "XLSX",
        title: `${report.label} — ${new Date().toLocaleDateString("id-ID")}`,
        parameters: {},
      });
      setMessage(`Laporan "${report.label}" masuk antrian. Pantau di Report Jobs.`);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Gagal membuat laporan");
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/reports">Buka Report Center</Link>
          </Button>
        }
        breadcrumb={breadcrumb}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      {error ? <ErrorState message={error} title="Gagal membuat laporan" /> : null}

      {message ? (
        <SectionCard className="border-emerald-200 bg-emerald-50/40" title="Laporan dalam antrian">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </p>
        </SectionCard>
      ) : null}

      {footer}

      <SectionCard description="Pilih laporan modul untuk digenerate ke format Excel atau PDF." title="Daftar Laporan">
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <div className="space-y-3" key={report.code}>
              <ModuleCard
                description={report.description ?? `Generate laporan ${report.label}.`}
                icon={<FileText className="h-5 w-5" />}
                meta={report.format ?? "XLSX"}
                title={report.label}
                tone="teal"
              />
              <div className="flex flex-wrap gap-2 px-1">
                <Button disabled={busyCode === report.code} onClick={() => void handleGenerate(report)} size="sm">
                  {busyCode === report.code ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Generate {report.format ?? "XLSX"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/reports/jobs">Lihat Antrian</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
