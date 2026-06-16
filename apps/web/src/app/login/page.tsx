"use client";

import { ArrowRight, BookOpen, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
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
    <main className="grid min-h-screen bg-background lg:grid-cols-2" role="main" aria-label="Login page">
      <div className="dashboard-hero-banner relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/30" aria-hidden="true">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold">NexAdmin</p>
              <p className="text-sm text-white/80">Enterprise School Platform</p>
            </div>
          </div>
          <Badge className="mt-8 border-white/30 bg-white/15 text-white" variant="outline">
            <Sparkles className="mr-1.5 h-3 w-3" /> Enterprise SaaS 2026
          </Badge>
          <h1 className="mt-6 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Kelola operasional sekolah dari satu dashboard terpadu.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/85">
            Akademik, keuangan, PPDB, HR, dan laporan — antarmuka enterprise yang cepat, rapi, dan mudah dipakai staff sekolah.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white" /> Keamanan sesi & role-based access
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white" /> Branding sekolah & multi-modul terintegrasi
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/70">NexAdmin © NexSMSID</p>
      </div>

      <div className="relative grid place-items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-20 lg:left-1/2" aria-hidden="true" />
        <div className="w-full max-w-md animate-fade-up">
          <Link className="mx-auto mb-8 flex w-max items-center gap-3 lg:hidden" href="/" aria-label="NexAdmin Home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-glow" aria-hidden="true">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight text-foreground">NexAdmin</span>
              <span className="block text-xs text-muted-foreground">Enterprise Panel</span>
            </span>
          </Link>

          <Card className="shadow-premium">
            <CardHeader className="pb-4">
              <Badge className="mb-3 w-max" variant="soft">
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
                    className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
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
