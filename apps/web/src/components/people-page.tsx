"use client";

import { FormEvent, ReactNode, useCallback, useMemo, useState } from "react";
import { Download, Edit3, Loader2, Plus, RefreshCcw, Trash2, Upload } from "lucide-react";

import type { MasterDataRecord } from "@nexsmsid/api-client";
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormModal,
  Input,
  PageHeader,
  SearchFilterBar,
  SectionCard,
  StatusBadge,
} from "@nexsmsid/ui";
import type { DataTableColumn, StatusBadgeMap } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import type { EntityType } from "@/lib/entity-picker-config";

export type PeopleFieldType = "checkbox" | "date" | "email" | "entity" | "number" | "select" | "tel" | "text" | "url";

export type PeopleField = {
  entityType?: EntityType;
  label: string;
  name: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  table?: boolean;
  type?: PeopleFieldType;
};

export type PeopleResourceConfig = {
  delete: (id: string) => Promise<unknown>;
  list: (options: { limit: number; page: number; search?: string; status?: string }) => Promise<{
    items: MasterDataRecord[];
    meta?: { total: number; page: number; limit: number };
  }>;
  get: (id: string) => Promise<MasterDataRecord>;
  create: (input: Record<string, unknown>) => Promise<MasterDataRecord>;
  update: (id: string, input: Record<string, unknown>) => Promise<MasterDataRecord>;
};

export type PeopleExcelConfig = {
  downloadTemplate: () => Promise<Blob>;
  exportData: () => Promise<Blob>;
  importData: (file: File) => Promise<{
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: Array<{ row?: number; field?: string; message: string }>;
  }>;
  saveBlob: (blob: Blob, filename: string) => void;
  templateFilename: string;
  exportFilename: string;
};

export type PeoplePageProps = {
  description: string;
  eyebrow?: string;
  excel?: PeopleExcelConfig;
  extraRowActions?: (item: MasterDataRecord) => ReactNode;
  fields: PeopleField[];
  resource: PeopleResourceConfig;
  statusOptions: string[];
  title: string;
};

const statusMap: StatusBadgeMap = {
  ACTIVE: { label: "ACTIVE", variant: "success" },
  INACTIVE: { label: "INACTIVE", variant: "outline" },
  GRADUATED: { label: "GRADUATED", variant: "secondary" },
  TRANSFERRED: { label: "TRANSFERRED", variant: "warning" },
  RESIGNED: { label: "RESIGNED", variant: "warning" },
  PERMANENT: { label: "PERMANENT", variant: "success" },
  CONTRACT: { label: "CONTRACT", variant: "warning" },
  HONORARY: { label: "HONORARY", variant: "secondary" },
  PROBATION: { label: "PROBATION", variant: "outline" },
};

export function PeoplePage({ description, eyebrow, excel, extraRowActions, fields, resource, statusOptions, title }: PeoplePageProps) {
  const [editing, setEditing] = useState<MasterDataRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MasterDataRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [excelBusy, setExcelBusy] = useState<"" | "export" | "import" | "template">("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: Array<{ row?: number; field?: string; message: string }>;
  } | null>(null);

  const tableFields = useMemo(() => fields.filter((field) => field.table !== false).slice(0, 6), [fields]);

  const loadList = useCallback(
    () =>
      resource.list({
        limit: 50,
        page: 1,
        search: appliedSearch || undefined,
        status: appliedStatus || undefined,
      }),
    [appliedSearch, appliedStatus, resource],
  );
  const { data: listData, error, loading, refetch, setError } = useApiQuery(loadList, [appliedSearch, appliedStatus, resource]);
  const items = listData?.items ?? [];
  const total = listData?.meta?.total ?? items.length;
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search && appliedStatus === statusFilter) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
    setAppliedStatus(statusFilter);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: MasterDataRecord) {
    setEditing(item);
    setFormOpen(true);
  }

  function handleDelete(item: MasterDataRecord) {
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);

    try {
      await resource.delete(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus data");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = buildPayload(fields, formData);

    try {
      if (editing) {
        await resource.update(editing.id, payload);
      } else {
        await resource.create(payload);
      }

      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadTemplate() {
    if (!excel) return;
    setError(null);
    setExcelBusy("template");
    try {
      const blob = await excel.downloadTemplate();
      excel.saveBlob(blob, excel.templateFilename);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Gagal mengunduh template");
    } finally {
      setExcelBusy("");
    }
  }

  async function handleExport() {
    if (!excel) return;
    setError(null);
    setExcelBusy("export");
    try {
      const blob = await excel.exportData();
      excel.saveBlob(blob, excel.exportFilename);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Gagal mengekspor data");
    } finally {
      setExcelBusy("");
    }
  }

  function openImport() {
    if (!excel) return;
    setImportFile(null);
    setImportResult(null);
    setImportModalOpen(true);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!excel || !importFile) return;
    setError(null);
    setExcelBusy("import");
    try {
      const result = await excel.importData(importFile);
      setImportResult(result);
      await refetch();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Gagal mengimpor data");
    } finally {
      setExcelBusy("");
    }
  }

  const columns: DataTableColumn<MasterDataRecord>[] = tableFields.map((field) => ({
    cell: (item) => formatCell(item[field.name], field),
    header: field.label,
    key: field.name,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            {excel ? (
              <>
                <Button disabled={Boolean(excelBusy)} onClick={openImport} variant="outline">
                  {excelBusy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
                </Button>
                <Button disabled={Boolean(excelBusy)} onClick={() => void handleDownloadTemplate()} variant="outline">
                  {excelBusy === "template" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Template
                </Button>
                <Button disabled={Boolean(excelBusy)} onClick={() => void handleExport()} variant="outline">
                  {excelBusy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export
                </Button>
              </>
            ) : (
              <>
                <Button disabled title="Import akan tersedia di Phase berikutnya" variant="outline">
                  <Upload className="h-4 w-4" /> Import
                </Button>
                <Button disabled title="Export akan tersedia di Phase berikutnya" variant="outline">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </>
            )}
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "People Management", title]}
        description={description}
        eyebrow={eyebrow ?? "Manajemen SDM"}
        title={title}
      />

      {error ? <ErrorState message={error} title="Gagal memproses data" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            filters={[
              {
                label: "Status",
                onChange: setStatusFilter,
                options: statusOptions.map((status) => ({ label: status, value: status })),
                placeholder: "Semua status",
                value: statusFilter,
              },
            ]}
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchValue={search}
          />
        }
        description={
          <>
            Search, filter, create, update, dan soft delete data. Total: <strong>{total}</strong> data.
          </>
        }
        title={`Data ${title}`}
      >
        <DataTable
          actions={(item) => (
            <>
              {extraRowActions ? extraRowActions(item) : null}
              <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => handleDelete(item)} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          emptyState={{
            action: (
              <Button onClick={openCreate} variant="soft">
                Tambah data pertama
              </Button>
            ),
            description: "Belum ada data atau hasil pencarian kosong.",
            title: `Data ${title} kosong`,
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[820px]"
        />
      </SectionCard>

      <FormModal
        description="Form People Management."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={`${editing ? "Edit" : "Tambah"} ${title}`}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <FieldInput field={field} item={editing} key={field.name} />
          ))}
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        description={`Hapus data ${String(pendingDelete?.name ?? pendingDelete?.nis ?? pendingDelete?.nip ?? pendingDelete?.id ?? "ini")}?`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus data"
      />

      {excel ? (
        <FormModal
          description={`Upload file Excel (.xlsx) hasil dari template. Maksimal: lihat kolom wajib di template.`}
          onClose={() => setImportModalOpen(false)}
          open={importModalOpen}
          title={`Import ${title} dari Excel`}
        >
          <form className="space-y-4" onSubmit={handleImport}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">File Excel</span>
              <input
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="block w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-primary"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                required
                type="file"
              />
            </label>
            {importResult ? (
              <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
                <p>
                  Total baris: <strong>{importResult.totalRows}</strong> | Berhasil:{" "}
                  <strong className="text-emerald-600">{importResult.successRows}</strong> | Gagal:{" "}
                  <strong className="text-rose-600">{importResult.failedRows}</strong>
                </p>
                {importResult.errors.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs">
                    {importResult.errors.slice(0, 8).map((err, index) => (
                      <li key={`${err.row ?? "row"}-${index}`}>
                        Baris {err.row ?? "?"}
                        {err.field ? ` (${err.field})` : ""}: {err.message}
                      </li>
                    ))}
                    {importResult.errors.length > 8 ? <li>...dan {importResult.errors.length - 8} error lainnya</li> : null}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setImportModalOpen(false)} type="button" variant="outline">
                Tutup
              </Button>
              <Button disabled={!importFile || excelBusy === "import"} type="submit">
                {excelBusy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload & Import
              </Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}

function FieldInput({ field, item }: { field: PeopleField; item: MasterDataRecord | null }) {
  const value = item?.[field.name];
  const type = field.type ?? "text";

  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
        <input defaultChecked={value !== false} name={field.name} type="checkbox" />
        {field.label}
      </label>
    );
  }

  if (type === "select") {
    return (
      <label className="space-y-2">
        <span className="text-sm font-bold text-muted-foreground">{field.label}</span>
        <select
          className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          defaultValue={typeof value === "string" ? value : ""}
          name={field.name}
          required={field.required}
        >
          <option value="" disabled>
            Pilih {field.label}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "entity" && field.entityType) {
    return (
      <label className="space-y-2">
        <span className="text-sm font-bold text-muted-foreground">{field.label}</span>
        <EntityPicker
          defaultValue={typeof value === "string" ? value : ""}
          entityType={field.entityType}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
        />
      </label>
    );
  }

  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground">{field.label}</span>
      <Input
        defaultValue={normalizeInputValue(value, type)}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        type={type}
      />
    </label>
  );
}

function buildPayload(fields: PeopleField[], formData: FormData) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const type = field.type ?? "text";

    if (type === "checkbox") {
      payload[field.name] = formData.get(field.name) === "on";
      continue;
    }

    const rawValue = formData.get(field.name);

    if (typeof rawValue !== "string" || rawValue.trim() === "") {
      if (field.required) payload[field.name] = "";
      else payload[field.name] = null;
      continue;
    }

    const trimmed = rawValue.trim();

    if (type === "number") {
      payload[field.name] = Number(trimmed);
      continue;
    }

    payload[field.name] = trimmed;
  }

  return payload;
}

function formatCell(value: unknown, field: PeopleField) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.code ?? record.id ?? "-");
  }
  const stringValue = String(value);

  if (field.name === "status" || field.name === "employmentStatus") {
    return <StatusBadge map={statusMap} value={stringValue} />;
  }

  if (field.name === "gender") {
    return stringValue === "MALE" ? "Laki-laki" : "Perempuan";
  }

  if (field.name === "relation") {
    const map: Record<string, string> = {
      FATHER: "Ayah",
      MOTHER: "Ibu",
      GUARDIAN: "Wali",
      GRANDPARENT: "Kakek/Nenek",
      SIBLING: "Saudara",
      OTHER: "Lainnya",
    };
    return map[stringValue] ?? stringValue;
  }

  return stringValue;
}

function normalizeInputValue(value: unknown, type: PeopleFieldType) {
  if (value === null || value === undefined) return "";
  if (type === "date" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}
