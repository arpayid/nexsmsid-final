"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import type { UserSummary } from "@nexsmsid/api-client";
import { DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function UsersPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    const response = await api.users();
    return response.data;
  }, [api]);
  const { data, error, loading, refetch } = useApiQuery<UserSummary[]>(loadUsers, [api]);
  const items = (data ?? []).filter((item) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(needle) ||
      item.email.toLowerCase().includes(needle) ||
      item.roles.some((role) => role.name.toLowerCase().includes(needle))
    );
  });

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <PermissionGate permission="users.view">
      <div className="space-y-8">
        <PageHeader
          breadcrumb={["Admin", "Pengguna"]}
          description="Kelola akun pengguna dan peran akses sistem."
          eyebrow="Pengaturan"
          title="Pengguna"
        />

        {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat pengguna" /> : null}

        <SectionCard
          action={
            <SearchFilterBar
              onSearchChange={setSearch}
              onSubmit={handleSearch}
              searchPlaceholder="Cari nama, email, atau peran..."
              searchValue={search}
            />
          }
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
