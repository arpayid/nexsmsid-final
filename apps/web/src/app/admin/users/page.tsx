"use client";

import { useCallback, useMemo } from "react";
import type { UserSummary } from "@nexsmsid/api-client";
import { DataTable, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function UsersPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const loadUsers = useCallback(async () => {
    const response = await api.users();
    return response.data;
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery<UserSummary[]>(loadUsers, [api]);
  const items = data ?? [];

  return (
    <PermissionGate permission="users.view">
      <div className="space-y-6">
        <PageHeader
          breadcrumb={["Admin", "Pengguna"]}
          description="Kelola akun pengguna dan peran akses sistem."
          eyebrow="Pengaturan"
          title="Pengguna"
        />

        {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat pengguna" /> : null}

        <SectionCard
          description={
            <>
              Daftar akun terdaftar. Total: <strong>{items.length}</strong>.
            </>
          }
          title="Data Pengguna"
        >
          <DataTable
            columns={[
              { key: "name", header: "Nama" },
              { key: "email", header: "Email" },
              {
                key: "roles",
                header: "Peran",
                cell: (item: UserSummary) => item.roles.map((role) => role.name).join(", ") || "-",
              },
              { key: "status", header: "Status" },
            ]}
            data={items}
            emptyState={{ description: "Belum ada pengguna.", title: "Data kosong" }}
            getRowId={(item) => item.id}
            loading={loading}
          />
        </SectionCard>
      </div>
    </PermissionGate>
  );
}
