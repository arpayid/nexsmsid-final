import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge, SectionCard } from "@nexsmsid/ui";

import type { QuickAlerts } from "./dashboard-types";
import { formatNumber } from "./dashboard-utils";

type DashboardAlertsProps = {
  alerts: QuickAlerts;
};

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  const rows = [
    {
      hint: "Invoice melewati batas bayar",
      href: "/admin/finance/invoices",
      id: "overdue",
      label: "Tagihan jatuh tempo",
      needsAction: alerts.overdueInvoices.count > 0,
      value: alerts.overdueInvoices.count,
    },
    {
      hint: "Sesi belum diinput",
      href: "/admin/academic/attendance",
      id: "attendance",
      label: "Presensi tanpa catatan",
      needsAction: alerts.attendanceMissing > 0,
      value: alerts.attendanceMissing,
    },
    {
      hint: "Perlu verifikasi ulang",
      href: "/admin/finance/payments",
      id: "payments",
      label: "Pembayaran ditolak",
      needsAction: alerts.rejectedPayments > 0,
      value: alerts.rejectedPayments,
    },
    {
      hint: "Antrian notifikasi pengguna",
      href: "/admin/communication/notifications",
      id: "notifications",
      label: "Notifikasi belum dibaca",
      needsAction: alerts.unreadNotifications > 0,
      value: alerts.unreadNotifications,
    },
  ];

  const attentionCount = rows.filter((row) => row.needsAction).length;

  return (
    <SectionCard
      action={<Badge variant={attentionCount > 0 ? "warning" : "success"}>{attentionCount} perlu tindakan</Badge>}
      contentClassName="space-y-3"
      description="Indikator operasional — klik kartu untuk buka modul terkait."
      title="Peringatan Operasional"
    >
      {rows.map((row) => (
        <Link
          className={`dashboard-alert-card group ${row.needsAction ? "dashboard-alert-card-warning" : "dashboard-alert-card-ok"}`}
          href={row.href}
          key={row.id}
        >
          <span
            className={
              row.needsAction
                ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600 ring-1 ring-amber-200/80"
                : "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/80"
            }
          >
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{row.label}</p>
            <p className="truncate text-xs text-muted-foreground">{row.hint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-foreground">{formatNumber(row.value)}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </SectionCard>
  );
}
