"use client";

import { Activity, BarChart3, Bell, ChevronDown, Database, Server } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, SectionCard, StatusBadge } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";

import type { SystemStatus } from "./dashboard-types";
import { formatNumber } from "./dashboard-utils";

type DashboardSystemStatusProps = {
  status: SystemStatus;
  unread: number;
};

export function DashboardSystemStatus({ status, unread }: DashboardSystemStatusProps) {
  return (
    <PermissionGate fallback={null} permission="reports.view">
      <DashboardSystemStatusPanel status={status} unread={unread} />
    </PermissionGate>
  );
}

function DashboardSystemStatusPanel({ status, unread }: DashboardSystemStatusProps) {
  const [open, setOpen] = useState(false);

  const rows = [
    {
      icon: Server,
      label: "API",
      value: status.api.status,
      detail: `Uptime ${formatNumber(status.api.uptime)} d · v${status.api.version}`,
    },
    { icon: Database, label: "Database", value: status.database.status, detail: status.database.provider },
    { icon: Activity, label: "Redis", value: status.redis.status, detail: status.redis.available ? "Tersedia" : "Perlu cek konfigurasi" },
    { icon: Bell, label: "Notifikasi belum dibaca", value: `${unread}`, detail: "Semua pengguna" },
  ];

  return (
    <SectionCard
      action={
        <button
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? "Sembunyikan" : "Tampilkan"}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      }
      contentClassName={open ? "space-y-3" : "hidden"}
      description="Informasi teknis runtime — untuk operator laporan & super admin."
      title="Status Sistem"
    >
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div className="dashboard-insight-row" key={row.label}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
                <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
              </div>
            </div>
            <StatusBadge value={row.value} />
          </div>
        );
      })}
      <Button asChild className="w-full" variant="soft">
        <Link href="/admin/reports">
          <BarChart3 className="h-4 w-4" /> Buka Pusat Laporan
        </Link>
      </Button>
    </SectionCard>
  );
}
