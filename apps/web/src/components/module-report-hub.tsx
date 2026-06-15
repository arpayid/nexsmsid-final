"use client";

import { useState, type ReactNode } from "react";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@nexsmsid/ui";

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

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>
      ) : null}

      {footer}

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.code}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                {report.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.description ? <p className="text-sm text-muted-foreground">{report.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button disabled={busyCode === report.code} onClick={() => void handleGenerate(report)} size="sm">
                  {busyCode === report.code ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Generate {report.format ?? "XLSX"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/reports/jobs">Lihat Antrian</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
