"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button, Card, Input } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { TurnstileField, type TurnstileHandle } from "@/components/turnstile-field";

const CV_ACCEPT = ".pdf,.jpg,.jpeg,.png";

export default function JobApplyPage() {
  const params = useParams<{ id: string }>();
  const api = useMemo(() => createBrowserApiClient(), []);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      let cvUrl: string | undefined;
      if (cvFile) {
        const uploadTokenCaptcha = await turnstileRef.current?.requestToken();
        const { uploadToken } = await api.issuePublicJobCvUploadToken(params.id, uploadTokenCaptcha ?? undefined);
        const cvUploadCaptcha = await turnstileRef.current?.requestToken();
        const uploaded = await api.uploadPublicJobCv(cvFile, uploadToken, cvUploadCaptcha ?? undefined);
        cvUrl = uploaded.cvUrl;
      }
      const applyCaptcha = await turnstileRef.current?.requestToken();
      await api.publicApplyJob(params.id, {
        applicantName: formData.get("applicantName"),
        applicantEmail: formData.get("applicantEmail") || undefined,
        applicantPhone: formData.get("applicantPhone") || undefined,
        cvUrl,
        note: formData.get("note") || undefined,
        ...(applyCaptcha ? { captchaToken: applyCaptcha } : {}),
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal mengirim lamaran");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <Button asChild variant="ghost">
          <Link href={`/jobs/${params.id}`}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
        <Card className="p-8">
          {submitted ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h1 className="mt-4 text-3xl font-semibold text-foreground">Lamaran Terkirim</h1>
              <p className="mt-3 text-muted-foreground">Tim BKK akan meninjau lamaran Anda.</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Form Lamaran</h1>
              <p className="mt-2 text-muted-foreground">Isi data pelamar dan unggah CV (PDF, JPEG, atau PNG, maks. 5 MB).</p>
              {error ? (
                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>
              ) : null}
              <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                <Input name="applicantName" placeholder="Nama lengkap" required />
                <Input name="applicantEmail" placeholder="Email" type="email" />
                <Input name="applicantPhone" placeholder="Nomor HP" />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">CV (opsional)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild type="button" variant="outline">
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Pilih File
                        <input
                          accept={CV_ACCEPT}
                          className="sr-only"
                          onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
                          type="file"
                        />
                      </label>
                    </Button>
                    <span className="text-sm text-muted-foreground">{cvFile ? cvFile.name : "Belum ada file dipilih"}</span>
                  </div>
                </label>
                <textarea
                  className="min-h-24 rounded-xl border border-border px-4 py-3 text-sm font-semibold"
                  name="note"
                  placeholder="Catatan singkat"
                />
                <TurnstileField ref={turnstileRef} />
                <Button disabled={submitting} type="submit">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kirim Lamaran
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
