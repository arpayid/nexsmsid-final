"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import type { UserSummary } from "@nexsmsid/api-client";
import { Button, ConfirmDialog, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function UsersPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionType, setActionType] = useState<"reset-password" | "unlock" | "force-change-password" | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

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

  async function executeAction() {
    if (!actionTarget || !actionType) return;
    setActionBusy(true);
    try {
      if (actionType === "reset-password") {
        await api.resetUserPassword(actionTarget.id, {});
        setActionResult("Password telah direset");
      } else if (actionType === "unlock") {
        await api.unlockUser(actionTarget.id);
        setActionResult("Akun berhasil dibuka");
      } else if (actionType === "force-change-password") {
        await api.forceChangePassword(actionTarget.id, {});
        setActionResult("Pengguna akan diminta ganti password saat login berikutnya");
      }
    } catch {
      setActionResult("Gagal: terjadi kesalahan");
    } finally {
      setActionBusy(false);
    }
  }

  function promptAction(id: string, name: string, type: "reset-password" | "unlock" | "force-change-password") {
    setActionTarget({ id, name });
    setActionType(type);
    setActionResult(null);
  }

  const actionTitle = actionType === "reset-password" ? "Reset Password" : actionType === "unlock" ? "Buka Akun" : "Paksa Ganti Password";
  const actionDescription = actionTarget
    ? actionType === "reset-password"
      ? `Reset password untuk ${actionTarget.name}? Password baru akan ditampilkan.`
      : actionType === "unlock"
        ? `Buka akun ${actionTarget.name} yang terkunci?`
        : `Paksa ${actionTarget.name} untuk mengganti password pada login berikutnya?`
    : "";

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
              {
                key: "actions",
                header: "Aksi",
                cell: (item: UserSummary) => (
                  <div className="flex gap-1">
                    <PermissionGate permission="users.reset-password">
                      <Button onClick={() => promptAction(item.id, item.name, "reset-password")} size="sm" variant="outline">
                        Reset PW
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="users.unlock">
                      <Button onClick={() => promptAction(item.id, item.name, "unlock")} size="sm" variant="outline">
                        Buka
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="users.force-change-password">
                      <Button onClick={() => promptAction(item.id, item.name, "force-change-password")} size="sm" variant="soft">
                        Paksa Ganti PW
                      </Button>
                    </PermissionGate>
                  </div>
                ),
              },
            ]}
            data={items}
            emptyState={{ description: "Belum ada pengguna.", title: "Data kosong" }}
            getRowId={(item) => item.id}
            loading={loading}
          />
        </SectionCard>
      </div>

      {/* Action confirmation */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel={actionType === "reset-password" ? "Reset" : actionType === "unlock" ? "Buka" : "Paksa"}
        description={
          actionResult ? (
            <span className="block space-y-3 text-left text-sm">
              <span className="block">{actionResult}</span>
              {actionType === "reset-password" && actionResult !== "Gagal: terjadi kesalahan" && (
                <span className="block text-muted-foreground">Klik Salin untuk menyimpan password baru.</span>
              )}
            </span>
          ) : (
            <span>{actionDescription}</span>
          )
        }
        onCancel={() => {
          setActionTarget(null);
          setActionType(null);
          setActionResult(null);
        }}
        onConfirm={() => {
          if (actionResult) {
            if (actionType === "reset-password") navigator.clipboard.writeText(actionResult);
            setActionTarget(null);
            setActionType(null);
            setActionResult(null);
            void refetch();
          } else {
            void executeAction();
          }
        }}
        open={Boolean(actionTarget) || Boolean(actionResult)}
        title={actionResult ? "Hasil" : actionTitle}
      />
    </PermissionGate>
  );
}
