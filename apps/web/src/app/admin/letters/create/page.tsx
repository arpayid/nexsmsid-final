"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { FilePlus2, Loader2, Send } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle, ErrorState, Input, PageHeader } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

const directions = ["INCOMING", "OUTGOING", "INTERNAL"];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
const recipientTypes = ["STUDENT", "GUARDIAN", "TEACHER", "STAFF", "USER", "EXTERNAL"];

type Template = Record<string, unknown> & {
  id: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  category?: string;
  requiresApproval?: boolean;
};
type SubmitMode = "draft" | "submit" | "issue";

export default function CreateLetterPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    direction: "OUTGOING",
    priority: "NORMAL",
    recipientType: "EXTERNAL",
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    const result = await api.listLetterTemplates({ limit: 100, status: "ACTIVE" });
    return result.items as Template[];
  }, [api]);
  const { data: templatesData, error: fetchError } = useApiQuery<Template[]>(loadTemplates, [api]);
  const templates = templatesData ?? [];
  const error = actionError ?? fetchError;

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function chooseTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    setForm((current) => ({
      ...current,
      templateId,
      subject: String(template?.subjectTemplate ?? current.subject ?? ""),
      body: String(template?.bodyTemplate ?? current.body ?? ""),
      category: String(template?.category ?? current.category ?? ""),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, mode: SubmitMode) {
    event.preventDefault();
    setSubmitting(mode);
    setActionError(null);
    setMessage(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
      const letter = await api.createLetter(payload);
      const id = letter.id as string;
      if (mode === "submit") await api.submitLetter(id);
      if (mode === "issue") await api.issueLetter(id);
      setMessage(
        mode === "draft"
          ? "Draft surat berhasil dibuat."
          : mode === "submit"
            ? "Surat berhasil dibuat dan disubmit."
            : "Surat berhasil dibuat dan diterbitkan.",
      );
      setForm({ direction: "OUTGOING", priority: "NORMAL", recipientType: "EXTERNAL" });
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal membuat surat");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        breadcrumb={["Admin", "Surat Menyurat", "Buat Surat"]}
        description="Buat draft surat dari template atau tulis manual, lalu simpan, submit, atau issue langsung jika tidak membutuhkan approval."
        eyebrow="Surat Menyurat"
        title="Buat Surat"
      />

      {error ? <ErrorState message={error} title="Gagal memproses surat" /> : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Form Surat</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event, "draft")}>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-muted-foreground">Template Opsional</span>
              <select
                className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={form.templateId ?? ""}
                onChange={(event) => chooseTemplate(event.target.value)}
              >
                <option value="">Tulis manual</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {String(template.code)} - {String(template.name)}
                  </option>
                ))}
              </select>
            </label>

            <Field label="Kategori" name="category" required value={form.category ?? ""} onChange={updateField} placeholder="SKL" />
            <SelectField
              label="Direction"
              name="direction"
              options={directions}
              value={form.direction ?? "OUTGOING"}
              onChange={updateField}
            />
            <SelectField label="Prioritas" name="priority" options={priorities} value={form.priority ?? "NORMAL"} onChange={updateField} />
            <SelectField
              label="Tipe Penerima"
              name="recipientType"
              options={recipientTypes}
              value={form.recipientType ?? "EXTERNAL"}
              onChange={updateField}
            />
            <Field label="Nama Penerima" name="recipientName" required value={form.recipientName ?? ""} onChange={updateField} />
            <Field label="Email Penerima" name="recipientEmail" value={form.recipientEmail ?? ""} onChange={updateField} />
            <EntityField entityType="student" label="Siswa Terkait" name="studentId" onChange={updateField} value={form.studentId ?? ""} />
            <EntityField
              entityType="guardian"
              label="Wali Terkait"
              name="guardianId"
              onChange={updateField}
              value={form.guardianId ?? ""}
            />
            <EntityField entityType="teacher" label="Guru Terkait" name="teacherId" onChange={updateField} value={form.teacherId ?? ""} />
            <EntityField entityType="staff" label="Staff Terkait" name="staffId" onChange={updateField} value={form.staffId ?? ""} />
            <EntityField
              entityType="counseling-case"
              label="Kasus BK Terkait"
              name="relatedCounselingCaseId"
              onChange={updateField}
              value={form.relatedCounselingCaseId ?? ""}
            />
            <EntityField
              entityType="discipline-violation"
              label="Pelanggaran Terkait"
              name="relatedDisciplineViolationId"
              onChange={updateField}
              value={form.relatedDisciplineViolationId ?? ""}
            />
            <TextArea label="Alamat Penerima" name="recipientAddress" value={form.recipientAddress ?? ""} onChange={updateField} />
            <TextArea label="Perihal" name="subject" required value={form.subject ?? ""} onChange={updateField} />
            <TextArea label="Isi Surat" name="body" required value={form.body ?? ""} onChange={updateField} className="md:col-span-2" />

            <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
              <Button disabled={Boolean(submitting)} type="submit" variant="outline">
                {submitting === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />} Simpan Draft
              </Button>
              <Button
                disabled={Boolean(submitting)}
                onClick={(event) => void handleSubmit(event as unknown as FormEvent<HTMLFormElement>, "submit")}
                type="button"
                variant="soft"
              >
                {submitting === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
              </Button>
              <Button
                disabled={Boolean(submitting)}
                onClick={(event) => void handleSubmit(event as unknown as FormEvent<HTMLFormElement>, "issue")}
                type="button"
              >
                {submitting === "issue" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />} Issue Langsung
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EntityField(props: {
  entityType: "student" | "guardian" | "teacher" | "staff" | "counseling-case" | "discipline-violation";
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground">{props.label}</span>
      <EntityPicker entityType={props.entityType} onChange={(value) => props.onChange(props.name, value)} value={props.value} />
      <input name={props.name} type="hidden" value={props.value} />
    </label>
  );
}

function Field(props: {
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground">
        {props.label}
        {props.required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <Input
        name={props.name}
        onChange={(event) => props.onChange(props.name, event.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        value={props.value}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground">{props.label}</span>
      <select
        className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        name={props.name}
        onChange={(event) => props.onChange(props.name, event.target.value)}
        value={props.value}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea(props: {
  className?: string;
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className={`space-y-2 ${props.className ?? ""}`}>
      <span className="text-sm font-bold text-muted-foreground">
        {props.label}
        {props.required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <textarea
        className="min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        name={props.name}
        onChange={(event) => props.onChange(props.name, event.target.value)}
        required={props.required}
        value={props.value}
      />
    </label>
  );
}
