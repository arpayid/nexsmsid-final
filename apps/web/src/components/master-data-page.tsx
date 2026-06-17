"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
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
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import type { EntityType } from "@/lib/entity-picker-config";

export type MasterDataField = {
  entityType?: EntityType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  table?: boolean;
  type?: "checkbox" | "date" | "entity" | "number" | "text" | "textarea" | "time";
};

export type MasterDataPageProps = {
  description: string;
  fields: MasterDataField[];
  resource: string;
  title: string;
};

export function MasterDataPage({ description, fields, resource, title }: MasterDataPageProps) {
  const [editing, setEditing] = useState<MasterDataRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MasterDataRecord | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
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
  const tableFields = fields.filter((field) => field.table !== false).slice(0, 5);

  const client = useMemo(() => createBrowserApiClient(), []);

  const excelMethods = {
    downloadTemplate: async () => {
      if (resource === "subjects") return client.downloadSubjectsTemplate();
      if (resource === "classrooms") return client.downloadClassroomsTemplate();
      throw new Error("Template not available for this resource");
    },
    exportData: async () => {
      if (resource === "subjects") return client.exportSubjects();
      if (resource === "classrooms") return client.exportClassrooms();
      throw new Error("Export not available for this resource");
    },
    importData: async (file: File) => {
      if (resource === "subjects") return client.importSubjects(file);
      if (resource === "classrooms") return client.importClassrooms(file);
      throw new Error("Import not available for this resource");
    },
  };

  const isExcelSupported = resource === "subjects" || resource === "classrooms";

  const loadList = useCallback(
    () => client.masterDataList(resource, { limit: 50, search: appliedSearch || undefined }),
    [appliedSearch, client, resource],
  );
  const { data: listData, error, loading, refetch, setError } = useApiQuery(loadList, [appliedSearch, client, resource]);
  const items = listData?.data ?? [];
  const total = items.length;
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
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
      await client.masterDataDelete(resource, pendingDelete.id);
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
        await client.masterDataUpdate(resource, editing.id, payload);
      } else {
        await client.masterDataCreate(resource, payload);
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
    if (!isExcelSupported) return;
    setError(null);
    setExcelBusy("template");
    try {
      const blob = await excelMethods.downloadTemplate();
      client.saveExcelBlob(blob, `${resource}-template.xlsx`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Gagal mengunduh template");
    } finally {
      setExcelBusy("");
    }
  }

  async function handleExport() {
    if (!isExcelSupported) return;
    setError(null);
    setExcelBusy("export");
    try {
      const blob = await excelMethods.exportData();
      client.saveExcelBlob(blob, `${resource}-export.xlsx`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Gagal mengekspor data");
    } finally {
      setExcelBusy("");
    }
  }

  function openImport() {
    if (!isExcelSupported) return;
    setImportFile(null);
    setImportResult(null);
    setImportModalOpen(true);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isExcelSupported || !importFile) return;
    setError(null);
    setExcelBusy("import");
    try {
      const result = await excelMethods.importData(importFile);
      setImportResult(result);
      await refetch();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Gagal mengimpor data");
    } finally {
      setExcelBusy("");
    }
  }

  const columns: DataTableColumn<MasterDataRecord>[] = [
    ...tableFields.map<DataTableColumn<MasterDataRecord>>((field) => ({
      cell: (item) => formatCell(item[field.name]),
      header: field.label,
      key: field.name,
    })),
    {
      cell: (item) => (
        <StatusBadge
          map={{
            Active: { label: "Aktif", variant: "success" },
            Inactive: { label: "Nonaktif", variant: "outline" },
          }}
          value={item.isActive === false ? "Inactive" : "Active"}
        />
      ),
      header: "Status",
      key: "status",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            {isExcelSupported ? (
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
            ) : null}
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Master Data", title]}
        description={description}
        eyebrow="Data Master"
        title={title}
      />

      {error ? <ErrorState message={error} title="Gagal memproses master data" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder={`Cari ${title.toLowerCase()}...`}
            searchValue={search}
          />
        }
        description={
          <>
            Cari, tambah, ubah, dan hapus data master. Total: <strong>{total}</strong> data.
          </>
        }
        title={`Data ${title}`}
      >
        <DataTable
          actions={(item) => (
            <>
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
        description="Form sederhana untuk master data."
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
        description={`Hapus ${String(pendingDelete?.name ?? pendingDelete?.code ?? pendingDelete?.id ?? "data ini")}?`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus data"
      />

      {isExcelSupported ? (
        <FormModal
          description={`Upload file Excel (.xlsx) hasil dari template.`}
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
              <div className="dashboard-mini-metric flex-col items-start gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  Total baris: <strong className="text-foreground">{importResult.totalRows}</strong> | Berhasil:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">{importResult.successRows}</strong> | Gagal:{" "}
                  <strong className="text-rose-600 dark:text-rose-400">{importResult.failedRows}</strong>
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

function FieldInput({ field, item }: { field: MasterDataField; item: MasterDataRecord | null }) {
  const value = item?.[field.name];
  const type = field.type ?? "text";
  const defaultValue = normalizeInputValue(value, type);

  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 px-4 py-3 text-sm font-medium text-foreground">
        <input
          className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
          defaultChecked={value !== false}
          name={field.name}
          type="checkbox"
        />
        {field.label}
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-semibold text-foreground">{field.label}</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          defaultValue={defaultValue}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
        />
      </label>
    );
  }

  if (type === "entity" && field.entityType) {
    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-foreground">{field.label}</span>
        <EntityPicker
          defaultValue={defaultValue}
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
      <span className="text-sm font-semibold text-foreground">{field.label}</span>
      <Input defaultValue={defaultValue} name={field.name} placeholder={field.placeholder} required={field.required} type={type} />
    </label>
  );
}

function buildPayload(fields: MasterDataField[], formData: FormData) {
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
      continue;
    }

    payload[field.name] = type === "number" ? Number(rawValue) : rawValue.trim();
  }

  return payload;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.code ?? record.id ?? "-");
  }
  return String(value);
}

function normalizeInputValue(value: unknown, type: MasterDataField["type"]) {
  if (value === null || value === undefined) return "";
  if (type === "date" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}
