"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, Banknote, Calculator, Loader2, Receipt, Wallet } from "lucide-react";

import { Card, CardContent, PageHeader, StatCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type PayrollSummary = {
  currentPeriod?: { code?: string; status?: string };
  runsCount?: number;
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
};

export default function Page() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadSummary = useCallback(() => api.getPayrollSummary() as Promise<PayrollSummary>, [api]);
  const { data: summary, error, loading } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "Payroll", "Dashboard"]}
        description="Ringkasan periode, daftar gaji, potongan, dan total gaji bersih."
        eyebrow="Payroll"
        title="Payroll Dashboard"
      />

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent>
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat ringkasan payroll...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Periode Aktif"
            value={(summary.currentPeriod as { code?: string } | undefined)?.code ?? "-"}
            description={(summary.currentPeriod as { status?: string } | undefined)?.status ?? "Belum ada periode"}
            icon={<Receipt className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Payroll Run"
            value={String(summary.runsCount ?? 0)}
            description="Pegawai dihitung"
            icon={<Calculator className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            title="Total Penerimaan"
            value={formatCurrency(summary.totalGross)}
            description="Gross payroll"
            icon={<Wallet className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            title="Total Potongan"
            value={formatCurrency(summary.totalDeductions)}
            description="Deduction payroll"
            icon={<Banknote className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            title="Gaji Bersih"
            value={formatCurrency(summary.totalNet)}
            description="Net payroll"
            icon={<Wallet className="h-5 w-5" />}
            tone="blue"
          />
        </div>
      ) : null}
    </div>
  );
}

function formatCurrency(value: unknown) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}
