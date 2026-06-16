import { DataTable, EmptyState, SectionCard, Badge } from "@nexsmsid/ui";

import type { ActivityFeedItem } from "./dashboard-types";
import { formatNumber } from "./dashboard-utils";

type DashboardActivityProps = {
  activity: ActivityFeedItem[];
};

export function DashboardActivity({ activity }: DashboardActivityProps) {
  return (
    <SectionCard
      action={activity.length > 0 ? <Badge variant="outline">{formatNumber(activity.length)} entri</Badge> : undefined}
      contentClassName="p-0 sm:p-0"
      description="Log audit terbaru dari aktivitas sistem."
      title="Aktivitas Terbaru"
    >
      {activity.length === 0 ? (
        <div className="p-6">
          <EmptyState description="Belum ada aktivitas audit." title="Tidak ada aktivitas" />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Aksi",
              key: "action",
              cell: (row) => (
                <span className="inline-flex rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">{row.action}</span>
              ),
            },
            { header: "Entitas", key: "entity" },
            { header: "Pelaku", key: "actor", cell: (row) => row.actor?.name ?? row.actor?.email ?? "System" },
            {
              header: "Waktu",
              key: "createdAt",
              cell: (row) => <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleString("id-ID")}</span>,
            },
          ]}
          data={activity.slice(0, 8)}
          getRowId={(row) => row.id}
          minWidth="min-w-[720px]"
        />
      )}
    </SectionCard>
  );
}
