"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { RoleSummary } from "@nexsmsid/api-client";
import { DataTable, PageHeader } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function RolesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const loadRoles = useCallback(async () => {
    const response = await api.roles();
    return response.data;
  }, [api]);
  const { data, error, loading } = useApiQuery<RoleSummary[]>(loadRoles, [api]);
  const items = data ?? [];

  return (
    <PermissionGate permission="roles.view">
      <div className="space-y-8">
        <PageHeader
          breadcrumb={["Admin", "Peran"]}
          description="Kelola peran dan izin akses pengguna."
          eyebrow="Pengaturan"
          title="Peran & Izin"
        />

        {error ? (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat data peran...
            </span>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Nama" },
              { key: "slug", header: "Slug" },
              {
                key: "permissions",
                header: "Izin",
                cell: (item: RoleSummary) => String(item.permissions.length),
              },
              {
                key: "isActive",
                header: "Status",
                cell: (item: RoleSummary) => (item.isActive ? "Aktif" : "Nonaktif"),
              },
            ]}
            data={items}
            getRowId={(item) => item.id}
          />
        )}
      </div>
    </PermissionGate>
  );
}
