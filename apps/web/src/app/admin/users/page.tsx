"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { UserSummary } from "@nexsmsid/api-client";
import { DataTable, PageHeader } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function UsersPage() {
  const api = useMemo(() => createBrowserApiClient(), []);

  const loadUsers = useCallback(async () => {
    const response = await api.users();
    return response.data;
  }, [api]);
  const { data, error, loading } = useApiQuery<UserSummary[]>(loadUsers, [api]);
  const items = data ?? [];

  return (
    <PermissionGate permission="users.view">
      <div className="space-y-8">
        <PageHeader
          breadcrumb={["Admin", "Pengguna"]}
          description="Kelola akun pengguna dan peran akses sistem."
          eyebrow="Pengaturan"
          title="Pengguna"
        />

        {error ? (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat data pengguna...
            </span>
          </div>
        ) : (
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
            getRowId={(item) => item.id}
          />
        )}
      </div>
    </PermissionGate>
  );
}
