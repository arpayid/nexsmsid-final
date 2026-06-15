"use client";

import { AlertCircle, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@nexsmsid/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold">Akun Belum Ditugaskan</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
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
    </div>
  );
}
