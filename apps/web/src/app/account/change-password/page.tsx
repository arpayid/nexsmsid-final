"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@nexsmsid/ui";
import { createBrowserApiClient } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth-storage";

export default function ChangePasswordPage() {
  const router = useRouter();
  const api = useMemo(() => createBrowserApiClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forced, setForced] = useState(false);
  const [redirectTimerId, setRedirectTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const user = await api.me();
        if (user.forceChangePassword) {
          setForced(true);
        }
      } catch {
        // ignore
      }
    }
    void checkUser();
  }, [api]);

  useEffect(() => {
    return () => {
      if (redirectTimerId !== null) {
        clearTimeout(redirectTimerId);
      }
    };
  }, [redirectTimerId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setSuccess(true);
      const timerId = setTimeout(() => {
        clearAuthSession();
        router.replace("/login");
      }, 2000);
      setRedirectTimerId(timerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold">Ganti Password</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {forced
              ? "Anda diwajibkan mengganti password untuk alasan keamanan sebelum melanjutkan."
              : "Ganti password akun Anda secara berkala untuk menjaga keamanan."}
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-bold">Password berhasil diubah!</p>
              <p className="mt-1 text-xs">Mengarahkan ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Password Saat Ini</span>
                  <Input type="password" name="currentPassword" required placeholder="Masukkan password lama" />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Password Baru</span>
                  <Input type="password" name="newPassword" required placeholder="Minimal 12 karakter" />
                  <p className="text-xs text-muted-foreground">Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Konfirmasi Password Baru</span>
                  <Input type="password" name="confirmPassword" required placeholder="Ketik ulang password baru" />
                </label>
              </div>

              <Button className="w-full" disabled={loading} type="submit" size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan Password
              </Button>
              {!forced && (
                <Button className="w-full mt-2" variant="ghost" onClick={() => router.back()} type="button">
                  Batal
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
