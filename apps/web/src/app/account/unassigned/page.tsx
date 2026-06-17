"use client";

import { AlertCircle, Loader2, LogOut, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@nexsmsid/ui";

import { AuthPageShell } from "@/components/auth-page-shell";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth-storage";

export default function UnassignedAccountPage() {
  const router = useRouter();
  const api = useMemo(() => createBrowserApiClient(), []);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
      // Local session cleanup still happens when the API call fails.
    }
    clearAuthSession();
    startTransition(() => router.replace("/login"));
  }

  return (
    <AuthPageShell
      badge="Perlu Penugasan"
      description="Akun Anda sudah terdaftar, tetapi belum memiliki peran portal. Hubungi administrator sekolah untuk aktivasi akses."
      heroIcon={UserX}
      heroTitle="Menunggu penugasan peran."
      highlights={["Hubungi admin sekolah", "Setelah ditugaskan, login ulang untuk masuk portal"]}
      tone="warning"
    >
      <Card className="shadow-premium">
        <CardHeader className="text-center">
          <Badge className="mx-auto mb-3 w-max border-amber-200 bg-amber-50 text-amber-700" variant="outline">
            <AlertCircle className="mr-2 h-3.5 w-3.5" /> Akun Belum Ditugaskan
          </Badge>
          <CardTitle className="text-xl">Akses Portal Belum Aktif</CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Akun Anda belum memiliki peran atau hak akses portal. Silakan hubungi administrator sekolah untuk mendapatkan penugasan peran
            yang sesuai.
          </p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={loggingOut} onClick={handleLogout} size="lg" variant="outline">
            {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Keluar
          </Button>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
