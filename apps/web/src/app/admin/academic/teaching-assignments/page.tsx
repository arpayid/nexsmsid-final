"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import type { TeachingAssignmentRecord } from "@nexsmsid/api-client";
import { Badge, Button, ConfirmDialog, DataTable, ErrorState, FormModal, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function TeachingAssignmentsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<TeachingAssignmentRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeachingAssignmentRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(
    () => api.listTeachingAssignments({ limit: 50, page: 1, search: appliedSearch || undefined }),
    [api, appliedSearch],
  );
  const { data, error: fetchError, loading, refetch } = useApiQuery(loadItems, [appliedSearch]);
  const items = data?.data ?? [];
  const total = (data?.meta as { total?: number } | undefined)?.total ?? items.length;
  const error = actionError ?? fetchError;

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

  function openEdit(item: TeachingAssignmentRecord) {
    setEditing(item);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await api.deleteTeachingAssignment(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus data");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      teacherId: formData.get("teacherId"),
      subjectId: formData.get("subjectId"),
      classroomId: formData.get("classroomId"),
      academicYearId: formData.get("academicYearId"),
      semesterId: formData.get("semesterId"),
      isActive: formData.get("isActive") === "on",
    };
    try {
      if (editing) {
        await api.updateTeachingAssignment(editing.id, payload);
      } else {
        await api.createTeachingAssignment(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<TeachingAssignmentRecord>[] = [
    {
      cell: (item) => item.teacher?.name ?? "-",
      header: "Guru",
      key: "teacher",
    },
    {
      cell: (item) => item.subject?.name ?? "-",
      header: "Mata Pelajaran",
      key: "subject",
    },
    {
      cell: (item) => item.classroom?.name ?? "-",
      header: "Kelas",
      key: "classroom",
    },
    {
      cell: (item) => item.semester?.name ?? "-",
      header: "Semester",
      key: "semester",
    },
    {
      cell: (item) => <Badge variant={item.isActive ? "success" : "outline"}>{item.isActive ? "Aktif" : "Nonaktif"}</Badge>,
      header: "Status",
      key: "status",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Akademik", "Mengajar"]}
        description="Atur penempatan guru untuk mata pelajaran di kelas tertentu."
        eyebrow="Akademik"
        title="Penugasan Mengajar"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses penugasan mengajar" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari guru, mapel, kelas..."
            searchValue={search}
          />
        }
        description={
          <>
            Kelola penugasan mengajar per semester. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Penugasan Mengajar"
      >
        <DataTable
          actions={(item) => (
            <>
              <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => setPendingDelete(item)} size="sm" variant="ghost">
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
            description: "Belum ada penugasan mengajar atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[700px]"
        />
      </SectionCard>

      <FormModal
        description="Tentukan guru, mata pelajaran, kelas, dan semester."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={`${editing ? "Edit" : "Tambah"} Penugasan Mengajar`}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Guru</span>
            <EntityPicker
              defaultValue={editing?.teacherId ?? ""}
              entityType="teacher"
              name="teacherId"
              placeholder="Cari guru..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Mata Pelajaran</span>
            <EntityPicker
              defaultValue={editing?.subjectId ?? ""}
              entityType="subject"
              name="subjectId"
              placeholder="Cari mapel..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kelas</span>
            <EntityPicker
              defaultValue={editing?.classroomId ?? ""}
              entityType="classroom"
              name="classroomId"
              placeholder="Cari kelas..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Semester</span>
            <EntityPicker
              defaultValue={editing?.semesterId ?? ""}
              entityType="semester"
              name="semesterId"
              placeholder="Cari semester..."
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tahun Ajaran</span>
            <EntityPicker
              defaultValue={editing?.academicYearId ?? ""}
              entityType="academic-year"
              name="academicYearId"
              placeholder="Cari tahun ajaran..."
              required
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground">
            <input defaultChecked={editing?.isActive ?? true} name="isActive" type="checkbox" /> Aktif
          </label>
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
        description={`Hapus penugasan ${pendingDelete?.teacher?.name ?? ""} — ${pendingDelete?.subject?.name ?? ""}?`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus penugasan"
      />
    </div>
  );
}
