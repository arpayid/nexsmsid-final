"use client";

import { ArrowRight, Loader2, LockKeyhole, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState, startTransition } from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { storeAuthSession } from "@/lib/auth-storage";
import { defaultLandingPath } from "@/lib/portal-routing";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

/** Accept only same-origin relative paths to prevent open-redirect (e.g. ?next=https://evil.com or //evil.com). */
function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = sanitizeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const client = createBrowserApiClient();

    client
      .me()
      .then((user) => {
        router.replace(explicitNext ?? defaultLandingPath(user));
      })
      .catch(async () => {
        try {
          const session = await client.refresh();
          storeAuthSession(session);
          router.replace(explicitNext ?? defaultLandingPath(session.user));
        } catch {
          // Not authenticated — stay on the login form.
        }
      });
  }, [explicitNext, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const session = await createBrowserApiClient().login({ email, password });
      storeAuthSession(session);
      const target = explicitNext ?? defaultLandingPath(session.user);
      startTransition(() => router.replace(target));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2" role="main" aria-label="Login page">
      <div className="nexadmin-sidebar hidden flex-col justify-between p-10 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-accent text-white" aria-hidden="true">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold">NexAdmin</p>
              <p className="text-sm text-sidebar-muted">Panel Administrasi Sekolah</p>
            </div>
          </div>
          <h1 className="mt-12 max-w-md text-3xl font-semibold leading-tight">Kelola operasional sekolah dari satu dashboard terpadu.</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-sidebar-muted">
            Akademik, keuangan, PPDB, HR, dan laporan — semuanya dalam antarmuka NexAdmin yang modern dan responsif.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">NexAdmin &copy; NexSMSID</p>
      </div>

      <div className="grid place-items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-40 lg:left-1/2" aria-hidden="true" />
        <div className="w-full max-w-md">
          <Link className="mx-auto mb-8 flex w-max items-center gap-3 lg:hidden" href="/" aria-label="NexAdmin Home">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight text-foreground">NexAdmin</span>
              <span className="block text-xs text-muted-foreground">NexSMSID Panel</span>
            </span>
          </Link>

          <Card className="shadow-elevated">
            <CardHeader>
              <Badge className="mb-3 w-max" variant="secondary" role="status">
                <LockKeyhole className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Akses Terbatas
              </Badge>
              <CardTitle className="text-xl">Masuk ke NexAdmin</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">Masuk menggunakan email dan password yang telah terdaftar.</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit} role="form" aria-label="Login form" noValidate>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="email">
                    Email
                  </label>
                  <Input
                    aria-label="Email address"
                    autoComplete="email"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="superadmin@nexsmsid.dev"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <Input
                    aria-label="Password"
                    autoComplete="current-password"
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    required
                    tabIndex={0}
                    type="password"
                    value={password}
                  />
                </div>
                {error ? (
                  <div
                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </div>
                ) : null}
                <Button className="w-full" disabled={submitting} size="lg" type="submit" aria-label="Submit login form">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Masuk <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
              <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
                Sesi login Anda diamankan dengan enkripsi dan disimpan secara aman.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-sm font-medium text-muted-foreground">
      Memuat halaman login...
    </main>
  );
}
