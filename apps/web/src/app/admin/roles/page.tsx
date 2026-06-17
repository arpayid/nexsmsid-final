"use client";

import { useCallback, useMemo } from "react";
import type { RoleSummary } from "@nexsmsid/api-client";
import { DataTable, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function RolesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const loadRoles = useCallback(async () => {
    const response = await api.roles();
    return response.data;
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery<RoleSummary[]>(loadRoles, [api]);
  const items = data ?? [];

  return (
    <PermissionGate permission="roles.view">
      <div className="space-y-6">
        <PageHeader
          breadcrumb={["Admin", "Peran"]}
          description="Kelola peran dan izin akses pengguna."
          eyebrow="Pengaturan"
          title="Peran & Izin"
        />

        {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat peran" /> : null}

        <SectionCard
          description={
            <>
              Peran sistem dan jumlah izin. Total: <strong>{items.length}</strong>.
            </>
          }
          title="Data Peran"
        >
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
            emptyState={{ description: "Belum ada peran.", title: "Data kosong" }}
            getRowId={(item) => item.id}
            loading={loading}
          />
        </SectionCard>
      </div>
    </PermissionGate>
  );
}
