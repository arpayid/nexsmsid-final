import { AlertCircle, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge, SectionCard, StatusBadge } from "@nexsmsid/ui";

import type { QuickAlerts } from "./dashboard-types";
import { formatNumber } from "./dashboard-utils";

type DashboardAlertsProps = {
  alerts: QuickAlerts;
};

type AlertRow = {
  hint: string;
  href: string;
  id: string;
  label: string;
  status: string;
  value: number;
};

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  const rows: AlertRow[] = [
    {
      id: "overdue",
      label: "Tagihan jatuh tempo",
      hint: "Invoice melewati batas bayar",
      href: "/admin/finance/invoices",
      status: alerts.overdueInvoices.count > 0 ? "WARNING" : "OK",
      value: alerts.overdueInvoices.count,
    },
    {
      id: "attendance",
      label: "Presensi tanpa catatan",
      hint: "Sesi belum diinput",
      href: "/admin/academic/attendance",
      status: alerts.attendanceMissing > 0 ? "WARNING" : "OK",
      value: alerts.attendanceMissing,
    },
    {
      id: "payments",
      label: "Pembayaran ditolak",
      hint: "Perlu verifikasi ulang",
      href: "/admin/finance/payments",
      status: alerts.rejectedPayments > 0 ? "WARNING" : "OK",
      value: alerts.rejectedPayments,
    },
    {
      id: "notifications",
      label: "Notifikasi belum dibaca",
      hint: "Antrian notifikasi pengguna",
      href: "/admin/communication/notifications",
      status: alerts.unreadNotifications > 0 ? "UNREAD" : "OK",
      value: alerts.unreadNotifications,
    },
  ];

  const attentionCount = rows.filter((row) => row.status !== "OK").length;

  return (
    <SectionCard
      action={<Badge variant={attentionCount > 0 ? "warning" : "success"}>{attentionCount} perlu tindakan</Badge>}
      contentClassName="space-y-3"
      description="Indikator operasional — klik baris untuk buka modul terkait."
      title="Peringatan Operasional"
    >
      {rows.map((row) => (
        <Link className="dashboard-insight-row group block" href={row.href} key={row.id}>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={
                row.status === "OK"
                  ? "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                  : "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
              }
            >
              <AlertCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{row.label}</p>
              <p className="truncate text-xs text-muted-foreground">{row.hint}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatNumber(row.value)}</span>
            <StatusBadge value={row.status} />
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </div>
        </Link>
      ))}

      {alerts.lowQuotaPeriods.length > 0 ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-sm text-amber-900 ring-1 ring-amber-100">
          <p className="font-semibold">Kuota PPDB hampir penuh</p>
          <ul className="mt-2 space-y-1 text-xs">
            {alerts.lowQuotaPeriods.slice(0, 2).map((period) => (
              <li key={period.name}>
                {period.name}: {formatNumber(period.registrations)}/{formatNumber(period.quota)} ({period.percent}%)
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {alerts.ppdbActive ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm text-primary ring-1 ring-primary/10">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              PPDB aktif: <span className="font-semibold">{alerts.ppdbActive.name}</span>, berakhir{" "}
              {new Date(alerts.ppdbActive.endDate).toLocaleDateString("id-ID")}.
            </p>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
