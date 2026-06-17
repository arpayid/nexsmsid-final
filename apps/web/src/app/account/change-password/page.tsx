"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@nexsmsid/ui";

import { AuthPageShell } from "@/components/auth-page-shell";
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
    <AuthPageShell
      badge="Keamanan Akun"
      description="Perbarui kredensial Anda untuk melindungi akses ke dashboard sekolah dan data sensitif."
      heroIcon={ShieldCheck}
      heroTitle="Jaga akun Anda tetap aman."
      highlights={["Password kuat minimal 12 karakter", "Sesi diperbarui setelah ganti password"]}
    >
      <Card className="shadow-premium">
        <CardHeader className="pb-4 text-center">
          <Badge className="mx-auto mb-3 w-max" variant="soft">
            <KeyRound className="mr-2 h-3.5 w-3.5" /> Ganti Password
          </Badge>
          <CardTitle className="text-xl">Perbarui Password</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {forced
              ? "Anda diwajibkan mengganti password sebelum melanjutkan."
              : "Ganti password secara berkala untuk menjaga keamanan akun."}
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-emerald-800">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-bold">Password berhasil diubah!</p>
              <p className="mt-1 text-xs">Mengarahkan ke halaman login...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error ? (
                <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Password Saat Ini</span>
                  <Input name="currentPassword" placeholder="Masukkan password lama" required type="password" />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Password Baru</span>
                  <Input name="newPassword" placeholder="Minimal 12 karakter" required type="password" />
                  <p className="text-xs text-muted-foreground">Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground">Konfirmasi Password Baru</span>
                  <Input name="confirmPassword" placeholder="Ketik ulang password baru" required type="password" />
                </label>
              </div>

              <Button className="w-full" disabled={loading} size="lg" type="submit">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan Password
              </Button>
              {!forced ? (
                <Button className="mt-2 w-full" onClick={() => router.back()} type="button" variant="ghost">
                  Batal
                </Button>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
