"use client";

import { FormEvent, Suspense, useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { MasterDataRecord, PpdbPeriodRecord } from "@nexsmsid/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { TurnstileField } from "@/components/turnstile-field";

type ReferenceData = {
  period: PpdbPeriodRecord;
  departments: MasterDataRecord[];
  competencies: MasterDataRecord[];
};

function PpdbRegisterForm() {
  const searchParams = useSearchParams();
  const competencyPrefill = searchParams.get("competency");
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCompetency, setSelectedCompetency] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const loadReferenceData = useCallback(async () => {
    const [periodRes, deptRes, compRes] = await Promise.all([
      api.getActivePpdbPeriod(),
      api.masterDataList("departments", { limit: 100 }),
      api.masterDataList("competencies", { limit: 100 }),
    ]);
    return {
      period: periodRes as unknown as PpdbPeriodRecord,
      departments: deptRes.data,
      competencies: compRes.data,
    };
  }, [api]);
  const { data, error: fetchError, loading } = useApiQuery<ReferenceData>(loadReferenceData, [api]);
  const period = data?.period ?? null;
  const departments = useMemo(() => data?.departments ?? [], [data?.departments]);
  const competencies = useMemo(() => data?.competencies ?? [], [data?.competencies]);
  const error = actionError ?? fetchError;

  const prefillCompetency = useMemo(() => {
    if (!competencyPrefill || !competencies.length) return null;
    return competencies.find((c) => c.id === competencyPrefill) ?? null;
  }, [competencyPrefill, competencies]);

  const deptValue = selectedDept || (prefillCompetency ? String(prefillCompetency.departmentId ?? "") : "");
  const competencyValue = selectedCompetency || (prefillCompetency?.id ?? "");

  const filteredCompetencies = useMemo(
    () => competencies.filter((c) => !deptValue || (c.departmentId as string) === deptValue),
    [competencies, deptValue],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      periodId: formData.get("periodId"),
      name: formData.get("name"),
      gender: formData.get("gender"),
      birthPlace: formData.get("birthPlace"),
      birthDate: formData.get("birthDate"),
      address: formData.get("address"),
      phone: formData.get("phone"),
      pin: formData.get("pin"),
      email: formData.get("email"),
      previousSchool: formData.get("previousSchool"),
      selectedDepartmentId: formData.get("departmentId"),
      selectedCompetencyId: formData.get("competencyId"),
      ...(captchaToken ? { captchaToken } : {}),
    };
    try {
      const response = await api.publicPpdbRegister(payload);
      const reg = response as Record<string, unknown>;
      setSuccess((reg.registrationNumber as string) ?? "Pendaftaran berhasil");
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal mengirim pendaftaran");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardContent>
            <div className="grid min-h-32 place-items-center text-sm font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat formulir pendaftaran...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !period) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <CardTitle className="text-center">Pendaftaran Berhasil</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Nomor registrasi Anda:</p>
            <p className="mt-2 text-2xl font-semibold tracking-wider text-primary">{success}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Simpan nomor registrasi dan PIN akses 6 digit untuk memantau status pendaftaran.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center px-4 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Formulir Pendaftaran PPDB</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{period ? `Periode: ${period.name as string}` : "Tidak ada periode aktif"}</p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          ) : null}

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {period ? <input name="periodId" type="hidden" value={period.id as string} /> : null}

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-muted-foreground">
                Nama Lengkap <span className="text-rose-500">*</span>
              </span>
              <Input name="name" required placeholder="Nama lengkap sesuai ijazah" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="gender"
                required
              >
                <option value="" disabled>
                  Pilih Jenis Kelamin
                </option>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tempat Lahir</span>
              <Input name="birthPlace" placeholder="Tempat lahir" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tanggal Lahir</span>
              <Input name="birthDate" type="date" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-muted-foreground">Alamat</span>
              <textarea
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="address"
                placeholder="Alamat lengkap"
                rows={3}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">
                Telepon <span className="text-rose-500">*</span>
              </span>
              <Input name="phone" required placeholder="Nomor telepon/WA" type="tel" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">
                PIN Akses (6 digit) <span className="text-rose-500">*</span>
              </span>
              <Input
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                name="pin"
                pattern="\d{6}"
                placeholder="Contoh: 123456"
                required
                title="PIN harus 6 digit angka"
                type="password"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Email</span>
              <Input name="email" placeholder="Email aktif" type="email" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-muted-foreground">Asal Sekolah</span>
              <Input name="previousSchool" placeholder="Nama sekolah sebelumnya" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jurusan</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="departmentId"
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedCompetency("");
                }}
                value={deptValue}
              >
                <option value="">Pilih Jurusan</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kompetensi</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="competencyId"
                onChange={(e) => setSelectedCompetency(e.target.value)}
                value={competencyValue}
              >
                <option value="">Pilih Kompetensi</option>
                {filteredCompetencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <TurnstileField onToken={setCaptchaToken} />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <Button disabled={submitting || !period} type="submit">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Daftar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PpdbRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center px-4 py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      }
    >
      <PpdbRegisterForm />
    </Suspense>
  );
}
