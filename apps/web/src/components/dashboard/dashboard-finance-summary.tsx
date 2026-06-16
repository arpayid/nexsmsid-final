import { Badge, ChartCard } from "@nexsmsid/ui";

import type { FinanceSummary } from "./dashboard-types";
import { formatCurrency, formatNumber } from "./dashboard-utils";

type DashboardFinanceSummaryProps = {
  finance: FinanceSummary;
};

export function DashboardFinanceSummary({ finance }: DashboardFinanceSummaryProps) {
  return (
    <ChartCard
      action={<Badge variant="outline">Keuangan</Badge>}
      description="Ringkasan invoice dan pembayaran terverifikasi."
      title="Ringkasan Keuangan"
    >
      <div className="grid grid-cols-2 gap-3">
        <FinanceSummaryTile label="Total Invoice" value={formatCurrency(finance.invoices.total)} />
        <FinanceSummaryTile label="Sudah Dibayar" value={formatCurrency(finance.payments.total)} />
        <FinanceSummaryTile label="Pembayaran OK" value={formatNumber(finance.payments.count)} />
        <FinanceSummaryTile label="Pengeluaran" value={formatCurrency(finance.expenses.total)} />
      </div>
    </ChartCard>
  );
}

function FinanceSummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
    </div>
  );
}
