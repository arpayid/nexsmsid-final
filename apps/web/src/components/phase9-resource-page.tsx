"use client";

import { FormEvent, ReactNode, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

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
import type { DataTableColumn, StatusBadgeMap, StatusBadgeVariant } from "@nexsmsid/ui";

import type { EntityType } from "@/lib/entity-picker-config";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Api = ReturnType<typeof createBrowserApiClient>;
type Row = Record<string, unknown>;
type ListResult = { items: Row[]; meta?: { total?: number } };

export type Phase9Field = {
  label: string;
  name: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number" | "date" | "textarea" | "select" | "entity";
  entityType?: EntityType;
};

export type Phase9Column = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};

export type Phase9Action = {
  label: string;
  run: (api: Api, row: Row) => Promise<unknown>;
  show?: (row: Row) => boolean;
  variant?: "primary" | "secondary" | "soft" | "outline" | "ghost";
};

export type Phase9ModalAction = {
  label: string;
  fields: Phase9Field[];
  submit: (api: Api, row: Row, payload: Row) => Promise<unknown>;
  show?: (row: Row) => boolean;
  variant?: "primary" | "secondary" | "soft" | "outline" | "ghost";
};

type Props = {
  breadcrumb: string[];
  columns: Phase9Column[];
  create?: (api: Api, input: Row) => Promise<unknown>;
  delete?: (api: Api, id: string) => Promise<unknown>;
  description: string;
  eyebrow: string;
  fields?: Phase9Field[];
  load: (api: Api, options: { limit: number; page: number; search?: string; status?: string }) => Promise<ListResult>;
  rowActions?: Phase9Action[];
  modalActions?: Phase9ModalAction[];
  statusOptions?: Array<{ label: string; value: string }>;
  statusMap?: StatusBadgeMap;
  title: string;
  update?: (api: Api, id: string, input: Row) => Promise<unknown>;
};

export function Phase9ResourcePage(props: Props) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [modalAction, setModalAction] = useState<{ action: Phase9ModalAction; row: Row } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loadList = useCallback(
    () => props.load(api, { limit: 50, page: 1, search: appliedSearch || undefined, status: appliedStatus || undefined }),
    [api, appliedSearch, appliedStatus, props],
  );
  const { data: listData, error, loading, refetch, setError } = useApiQuery(loadList, [api, appliedSearch, appliedStatus, props.load]);
  const items = listData?.items ?? [];
  const total = listData?.meta?.total ?? items.length;
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search && appliedStatus === status) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
    setAppliedStatus(status);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.create && !props.update) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Row = {};

    for (const field of props.fields ?? []) {
      const value = formData.get(field.name);
      if (value === null || value === "") continue;
      payload[field.name] = field.type === "number" ? Number(value) : value;
    }

    try {
      if (editing && props.update) await props.update(api, editing.id as string, payload);
      else if (props.create) await props.create(api, payload);
      setEditing(null);
      setFormOpen(false);
      await refetch();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(row: Row) {
    if (!props.delete) return;
    setPendingDelete(row);
  }

  async function confirmDelete() {
    if (!props.delete || !pendingDelete) return;
    setError(null);
    try {
      await props.delete(api, pendingDelete.id as string);
      setPendingDelete(null);
      await refetch();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus data");
    }
  }

  async function runAction(action: Phase9Action, row: Row) {
    setError(null);
    try {
      await action.run(api, row);
      await refetch();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Aksi gagal dijalankan");
    }
  }

  async function handleModalActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalAction) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Row = {};
    for (const field of modalAction.action.fields) {
      const value = formData.get(field.name);
      if (value === null || value === "") continue;
      payload[field.name] = field.type === "number" ? Number(value) : value;
    }
    try {
      await modalAction.action.submit(api, modalAction.row, payload);
      setModalAction(null);
      await refetch();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Aksi gagal dijalankan");
    } finally {
      setSubmitting(false);
    }
  }

  const tableColumns = props.columns.map<DataTableColumn<Row>>((column) => ({
    cell: (row) =>
      column.render ? (
        column.render(row)
      ) : column.key === "status" ? (
        <StatusBadge map={props.statusMap} value={row.status} />
      ) : (
        String(getPath(row, column.key) ?? "-")
      ),
    header: column.label,
    key: column.key,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            {props.create ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            ) : null}
          </>
        }
        breadcrumb={props.breadcrumb}
        description={props.description}
        eyebrow={props.eyebrow}
        title={props.title}
      />

      {error ? <ErrorState message={error} title="Gagal memproses data" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            filters={
              props.statusOptions
                ? [{ label: "Status", onChange: setStatus, options: props.statusOptions, placeholder: "Semua status", value: status }]
                : undefined
            }
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchValue={search}
          />
        }
        description={
          <span>
            Total: <strong>{total}</strong> data
          </span>
        }
        title={props.title}
      >
        <DataTable
          actions={(row) => (
            <>
              {(props.rowActions ?? [])
                .filter((action) => action.show?.(row) ?? true)
                .map((action) => (
                  <Button key={action.label} onClick={() => void runAction(action, row)} size="sm" variant={action.variant ?? "soft"}>
                    {action.label}
                  </Button>
                ))}
              {(props.modalActions ?? [])
                .filter((action) => action.show?.(row) ?? true)
                .map((action) => (
                  <Button key={action.label} onClick={() => setModalAction({ action, row })} size="sm" variant={action.variant ?? "soft"}>
                    {action.label}
                  </Button>
                ))}
              {props.update ? (
                <Button
                  onClick={() => {
                    setEditing(row);
                    setFormOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
              ) : null}
              {props.delete ? (
                <Button onClick={() => void handleDelete(row)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              ) : null}
            </>
          )}
          columns={tableColumns}
          data={items}
          getRowId={(row) => row.id as string}
          loading={loading}
          minWidth="min-w-[900px]"
        />
      </SectionCard>

      <FormModal
        description="Lengkapi field yang tersedia."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={editing ? "Edit Data" : "Tambah Data"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {(props.fields ?? []).map((field) => (
            <label className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"} key={field.name}>
              <span className="text-sm font-bold text-muted-foreground">
                {field.label}
                {field.required ? <span className="text-rose-500"> *</span> : null}
              </span>
              {field.type === "select" ? (
                <select
                  className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  defaultValue={String(editing?.[field.name] ?? "")}
                  name={field.name}
                  required={field.required}
                >
                  <option value="">Pilih...</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "entity" && field.entityType ? (
                <EntityPicker
                  defaultValue={String(editing?.[field.name] ?? "")}
                  entityType={field.entityType}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  className="min-h-24 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  defaultValue={String(editing?.[field.name] ?? "")}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : (
                <Input
                  defaultValue={formatDefault(editing?.[field.name], field.type)}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type ?? "text"}
                />
              )}
            </label>
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
        description="Data akan dihapus dari daftar aktif. Tindakan ini mengikuti endpoint delete yang sudah tervalidasi."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Hapus data ini?"
      />

      <FormModal
        description="Lengkapi field yang diperlukan."
        onClose={() => setModalAction(null)}
        open={Boolean(modalAction)}
        title={modalAction?.action.label ?? "Aksi"}
      >
        {modalAction ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleModalActionSubmit}>
            {modalAction.action.fields.map((field) => (
              <label className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"} key={field.name}>
                <span className="text-sm font-bold text-muted-foreground">
                  {field.label}
                  {field.required ? <span className="text-rose-500"> *</span> : null}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : (
                  <Input name={field.name} placeholder={field.placeholder} required={field.required} type={field.type ?? "text"} />
                )}
              </label>
            ))}
            <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setModalAction(null)} type="button" variant="outline">
                Batal
              </Button>
              <Button disabled={submitting} type="submit">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
              </Button>
            </div>
          </form>
        ) : null}
      </FormModal>
    </div>
  );
}

export function statusMap(values: string[]): StatusBadgeMap {
  return Object.fromEntries(
    values.map((value) => [
      value,
      {
        label: value,
        variant:
          value.includes("APPROVED") ||
          value.includes("ACCEPTED") ||
          value.includes("PUBLISHED") ||
          value.includes("COMPLETED") ||
          value.includes("ACTIVE") ||
          value.includes("WORKING")
            ? "success"
            : value.includes("REJECTED") || value.includes("CANCELLED") || value.includes("CLOSED") || value.includes("UNEMPLOYED")
              ? "warning"
              : value.includes("ONGOING") || value.includes("REVIEW")
                ? "info"
                : "outline",
      },
    ]),
  ) as Record<string, { label: string; variant: StatusBadgeVariant }>;
}

export function options(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

function getPath(row: Row, path: string) {
  return path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | null | undefined)?.[key], row);
}

function formatDefault(value: unknown, type?: string) {
  if (!value) return "";
  if (type === "date") return String(value).slice(0, 10);
  return String(value);
}
