"use client";

import { useMemo, useState } from "react";
import { Laptop, Shield, LogOut, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Card, CardContent, CardHeader, CardTitle, Badge, PageHeader, StatCard } from "@nexsmsid/ui";
import { Phase9ResourcePage, options } from "@/components/phase9-resource-page";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth-storage";

export default function SecurityPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <>
      <PageHeader
        breadcrumb={["Akun", "Keamanan"]}
        description="Kelola keamanan akun Anda, lihat riwayat login, dan keluar dari semua perangkat."
        eyebrow="Keamanan Akun"
        title="Keamanan Akun"
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Ubah password Anda secara berkala untuk menjaga keamanan akun.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/account/change-password">Ganti Password</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-rose-600">
              <LogOut className="h-5 w-5" />
              Sesi Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Keluar dari semua perangkat web yang pernah Anda gunakan.</p>
            <Button
              onClick={handleLogoutAll}
              disabled={loggingOut}
              variant="outline"
              className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {loggingOut ? "Memproses..." : "Keluar Semua Perangkat"}
            </Button>
          </CardContent>
        </Card>
      </div>

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
