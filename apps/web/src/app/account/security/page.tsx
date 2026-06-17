"use client";

import { useMemo, useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Button, PageHeader, SectionCard } from "@nexsmsid/ui";
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
