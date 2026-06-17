"use client";

import { useCallback, useMemo } from "react";
import { Banknote, Calculator, Loader2, Receipt, Wallet, Settings, FileText } from "lucide-react";

import { Card, CardContent, ErrorState, ModuleCard, PageHeader, SectionCard, StatCard } from "@nexsmsid/ui";
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
  const { data: summary, error, loading, refetch } = useApiQuery(loadSummary, [api]);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "Payroll", "Dashboard"]}
        description="Ringkasan periode, daftar gaji, potongan, dan total gaji bersih."
        eyebrow="Payroll"
        title="Payroll Dashboard"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat dashboard payroll" /> : null}

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

      <SectionCard description="Akses cepat modul penggajian." title="Menu Payroll">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            description="Kelola periode dan siklus penggajian."
            href="/admin/payroll/periods"
            icon={<Receipt className="h-5 w-5" />}
            title="Periode Penggajian"
            tone="blue"
          />
          <ModuleCard
            description="Daftar gaji per pegawai."
            href="/admin/payroll/runs"
            icon={<Calculator className="h-5 w-5" />}
            title="Payroll Run"
            tone="violet"
          />
          <ModuleCard
            description="Slip gaji dan riwayat terbit."
            href="/admin/payroll/payslips"
            icon={<Wallet className="h-5 w-5" />}
            title="Slip Gaji"
            tone="emerald"
          />
          <ModuleCard
            description="Pembayaran gaji ke pegawai."
            href="/admin/payroll/payments"
            icon={<Banknote className="h-5 w-5" />}
            title="Pembayaran"
            tone="amber"
          />
          <ModuleCard
            description="Komponen dan pengaturan gaji."
            href="/admin/payroll/settings"
            icon={<Settings className="h-5 w-5" />}
            title="Pengaturan"
            tone="slate"
          />
          <ModuleCard
            description="Laporan HR dan payroll."
            href="/admin/payroll/reports"
            icon={<FileText className="h-5 w-5" />}
            title="Laporan"
            tone="teal"
          />
        </div>
      </SectionCard>
    </div>
  );
}

function formatCurrency(value: unknown) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}
