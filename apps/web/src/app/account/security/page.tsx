"use client";

import { useMemo, useCallback, useState } from "react";
import { KeyRound, LogOut, ShieldX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Button, ConfirmDialog, DataTable, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";
import { Phase9ResourcePage, options } from "@/components/phase9-resource-page";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth-storage";
import { useApiQuery } from "@/hooks/use-api-query";

export default function SecurityPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [sessionsVersion, setSessionsVersion] = useState(0);

  const loadSessions = useCallback(async () => {
    void sessionsVersion;
    const result = await api.listSessions();
    return result.items ?? [];
  }, [api, sessionsVersion]);
  const { data: sessions, error: sessionsError, loading: sessionsLoading, refetch: refetchSessions } = useApiQuery(loadSessions, [api]);

  async function handleLogoutAll() {
    if (!confirm("Anda yakin ingin keluar dari semua perangkat?")) return;
    setLoggingOut(true);
    try {
      await api.logoutAll();
      clearAuthSession();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
      alert("Gagal logout dari semua perangkat");
    }
  }

  async function handleRevokeSession() {
    if (!revokeTarget) return;
    try {
      await api.revokeSession(revokeTarget);
      setRevokeTarget(null);
      setSessionsVersion((v) => v + 1);
    } catch {
      alert("Gagal menghentikan sesi");
      setRevokeTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb={["Akun", "Keamanan"]}
        description="Kelola keamanan akun Anda, lihat sesi aktif, riwayat login, dan keluar dari semua perangkat."
        eyebrow="Keamanan Akun"
        title="Keamanan Akun"
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <SectionCard description="Ubah password Anda secara berkala untuk menjaga keamanan akun." title="Password">
          <Button asChild className="w-full" variant="outline">
            <Link href="/account/change-password">
              <KeyRound className="h-4 w-4" /> Ganti Password
            </Link>
          </Button>
        </SectionCard>

        <SectionCard description="Keluar dari semua perangkat web yang pernah Anda gunakan." title="Sesi Aktif">
          <Button
            className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={loggingOut}
            onClick={handleLogoutAll}
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Memproses..." : "Keluar Semua Perangkat"}
          </Button>
        </SectionCard>
      </div>

      {/* Active Sessions */}
      <div className="mt-8">
        <SectionCard description="Perangkat yang saat ini login ke akun Anda. Hentikan sesi yang tidak dikenal." title="Sesi Perangkat">
          {sessionsError ? <ErrorState message={sessionsError} onRetry={() => void refetchSessions()} title="Gagal memuat sesi" /> : null}

          {sessions && sessions.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: "createdAt",
                  header: "Login",
                  cell: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-"),
                },
                {
                  key: "expiresAt",
                  header: "Kedaluwarsa",
                  cell: (row: any) => (row.expiresAt ? new Date(row.expiresAt).toLocaleString("id-ID") : "-"),
                },
                { key: "ipAddress", header: "IP Address", cell: (row: any) => row.ipAddress ?? "-" },
                {
                  key: "userAgent",
                  header: "Browser/Device",
                  cell: (row: any) => (
                    <span className="truncate max-w-[200px] block" title={row.userAgent ?? "-"}>
                      {row.userAgent ?? "-"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Aksi",
                  cell: (row: any) => (
                    <Button onClick={() => setRevokeTarget(row.id)} size="sm" variant="soft" className="text-rose-600">
                      <ShieldX className="h-3 w-3" /> Hentikan
                    </Button>
                  ),
                },
              ]}
              data={sessions}
              emptyState={{ description: "Tidak ada sesi aktif.", title: "Kosong" }}
              getRowId={(row: any) => row.id}
              loading={sessionsLoading}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada sesi aktif.</p>
          )}
        </SectionCard>
      </div>

      {/* Revoke Confirmation */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Hentikan Sesi"
        description="Hentikan sesi ini? Perangkat tersebut akan logout paksa."
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => void handleRevokeSession()}
        open={Boolean(revokeTarget)}
        title="Hentikan Sesi"
      />

      {/* Login History */}
      <div className="mt-8">
        <Phase9ResourcePage
          breadcrumb={["Akun", "Keamanan", "Riwayat Login"]}
          eyebrow="Keamanan Akun"
          columns={[
            { key: "createdAt", label: "Waktu", render: (row) => new Date(row.createdAt as string).toLocaleString("id-ID") },
            { key: "ipAddress", label: "IP Address", render: (row) => String(row.ipAddress ?? "-") },
            {
              key: "userAgent",
              label: "Browser/Device",
              render: (row) => (
                <span className="truncate max-w-[200px] block" title={String(row.userAgent ?? "-")}>
                  {String(row.userAgent ?? "-")}
                </span>
              ),
            },
            {
              key: "success",
              label: "Status",
              render: (row) => <Badge variant={row.success ? "success" : "warning"}>{row.success ? "Berhasil" : "Gagal"}</Badge>,
            },
            { key: "reason", label: "Keterangan", render: (row) => String(row.reason ?? "-") },
          ]}
          description="Riwayat percobaan masuk ke akun Anda."
          load={(api, params) => api.getLoginHistory(params)}
          title="Riwayat Login"
        />
      </div>
    </>
  );
}
