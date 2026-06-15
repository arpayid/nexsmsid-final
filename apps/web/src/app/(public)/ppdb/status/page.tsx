"use client";

import { FormEvent, useRef, useState } from "react";
import { Loader2, Search, Upload } from "lucide-react";
import Link from "next/link";

import type { PpdbStatusResult } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { formatDateId } from "@/lib/public-site";
import { TurnstileField, type TurnstileHandle } from "@/components/turnstile-field";

const REQUIRED_DOCS = ["Kartu Keluarga", "Akta Kelahiran", "Ijazah/SKHUN"];

export default function PpdbStatusPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PpdbStatusResult | null>(null);
  const [credentials, setCredentials] = useState<{ registrationNumber: string; phone: string; pin?: string } | null>(null);
  const [docName, setDocName] = useState(REQUIRED_DOCS[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [settingPin, setSettingPin] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResult(null);
    const formData = new FormData(event.currentTarget);
    const registrationNumber = String(formData.get("registrationNumber") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const pin = String(formData.get("pin") ?? "").trim();
    try {
      const statusCaptcha = await turnstileRef.current?.requestToken();
      const data = await createBrowserApiClient().checkPpdbStatus({
        registrationNumber,
        phone,
        ...(pin ? { pin } : {}),
        ...(statusCaptcha ? { captchaToken: statusCaptcha } : {}),
      });
      setResult(data);
      setCredentials({ registrationNumber, phone, ...(pin ? { pin } : {}) });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal memeriksa status");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentials) return;
    setSettingPin(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const pin = String(formData.get("newPin") ?? "").trim();
    try {
      const api = createBrowserApiClient();
      const setPinCaptcha = await turnstileRef.current?.requestToken();
      await api.setPublicPpdbPin({
        registrationNumber: credentials.registrationNumber,
        phone: credentials.phone,
        pin,
        captchaToken: setPinCaptcha ?? undefined,
      });
      const refreshCaptcha = await turnstileRef.current?.requestToken();
      const refreshed = await api.checkPpdbStatus({
        registrationNumber: credentials.registrationNumber,
        phone: credentials.phone,
        pin,
        captchaToken: refreshCaptcha ?? undefined,
      });
      setResult(refreshed);
      setCredentials({ ...credentials, pin });
      setMessage("PIN akses berhasil dibuat. Anda dapat mengunggah dokumen.");
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : "Gagal membuat PIN akses");
    } finally {
      setSettingPin(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentials || !docFile || !result?.uploadToken) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const api = createBrowserApiClient();
      const fileUploadCaptcha = await turnstileRef.current?.requestToken();
      const uploaded = await api.uploadPublicPpdbFile(docFile, result.uploadToken, fileUploadCaptcha ?? undefined);
      const submitDocCaptcha = await turnstileRef.current?.requestToken();
      await api.submitPublicPpdbDocument({
        registrationNumber: credentials.registrationNumber,
        phone: credentials.phone,
        name: docName,
        fileKey: uploaded.fileKey,
        uploadToken: result.uploadToken,
        captchaToken: submitDocCaptcha ?? undefined,
      });
      const refreshCaptcha = await turnstileRef.current?.requestToken();
      const refreshed = await api.checkPpdbStatus({
        ...credentials,
        captchaToken: refreshCaptcha ?? undefined,
      });
      setResult(refreshed);
      setMessage("Dokumen berhasil diunggah.");
      setDocFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Gagal mengunggah dokumen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="secondary">PPDB</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cek Status Pendaftaran</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Masukkan nomor registrasi, nomor telepon, dan PIN akses 6 digit yang dibuat saat mendaftar.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Form Pengecekan</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nomor Registrasi</span>
              <Input name="registrationNumber" placeholder="REG-202606-00001" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nomor Telepon</span>
              <Input name="phone" placeholder="08xxxxxxxxxx" required type="tel" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">PIN Akses (6 digit)</span>
              <Input
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                name="pin"
                pattern="\d{6}"
                placeholder="PIN dari formulir pendaftaran"
                title="PIN harus 6 digit angka"
                type="password"
              />
            </label>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <TurnstileField ref={turnstileRef} />
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Periksa Status
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card className="mt-6 p-6">
          <p className="text-sm text-muted-foreground">Nomor Registrasi</p>
          <p className="font-semibold">{result.registrationNumber}</p>
          <p className="mt-4 text-sm text-muted-foreground">Nama</p>
          <p className="font-semibold">{result.name}</p>
          <p className="mt-4 text-sm text-muted-foreground">Periode</p>
          <p className="font-medium">{result.periodName}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="info">{result.status}</Badge>
            <Badge variant="secondary">{result.selectionStatus}</Badge>
          </div>
          {result.competencyName ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Pilihan jurusan: <span className="font-medium text-foreground">{result.competencyName}</span>
            </p>
          ) : null}
          {result.createdAt ? <p className="mt-4 text-xs text-muted-foreground">Terdaftar pada {formatDateId(result.createdAt)}</p> : null}

          {result.requiresPinSetup ? (
            <form className="mt-6 space-y-4 border-t pt-6" onSubmit={handleSetPin}>
              <p className="text-sm font-semibold">Buat PIN Akses</p>
              <p className="text-sm text-muted-foreground">
                {result.message ?? "Pendaftaran lama membutuhkan PIN 6 digit sebelum unggah dokumen."}
              </p>
              <label className="block space-y-2">
                <span className="text-sm font-medium">PIN Baru (6 digit)</span>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  name="newPin"
                  pattern="\d{6}"
                  placeholder="Buat PIN 6 digit"
                  required
                  title="PIN harus 6 digit angka"
                  type="password"
                />
              </label>
              {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
              <Button className="w-full" disabled={settingPin} type="submit">
                {settingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan PIN
              </Button>
            </form>
          ) : result.uploadToken ? (
            <>
              {(result.documents ?? []).length ? (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-semibold">Dokumen Terunggah</p>
                  {(result.documents ?? []).map((doc) => (
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" key={doc.id}>
                      <span>{doc.name}</span>
                      <Badge variant={doc.status === "VERIFIED" ? "success" : "outline"}>{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : null}
              <form className="mt-6 space-y-4 border-t pt-6" onSubmit={handleUpload}>
                <p className="text-sm font-semibold">Unggah Dokumen</p>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Jenis Dokumen</span>
                  <select
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    onChange={(event) => setDocName(event.target.value)}
                    value={docName}
                  >
                    {REQUIRED_DOCS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">File (PDF/JPG/PNG, max 5MB)</span>
                  <Input accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setDocFile(event.target.files?.[0] ?? null)} type="file" />
                </label>
                {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
                <Button className="w-full" disabled={uploading || !docFile} type="submit">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Unggah Dokumen
                </Button>
              </form>
            </>
          ) : null}
        </Card>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Belum mendaftar?{" "}
        <Link className="font-medium text-primary hover:underline" href="/ppdb/register">
          Daftar PPDB
        </Link>
      </p>
    </div>
  );
}
