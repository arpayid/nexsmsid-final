"use client";

import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { ExamRoomRecord } from "@nexsmsid/api-client";
import { Button, ConfirmDialog, DataTable, ErrorState, Input, PageHeader, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamFormPayload = Record<string, string | number | boolean>;

export default function ExamRoomsPage() {
  const client = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<ExamRoomRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    const res = await client.listExamRooms({ limit: 100 });
    return res.data;
  }, [client]);

  const { data, error, loading, refetch, setError } = useApiQuery<ExamRoomRecord[]>(loadRooms, [client]);
  const rooms = data ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload: ExamFormPayload = {};
    for (const [key, value] of form.entries()) {
      if (key === "isActive") {
        payload[key] = value === "on";
        continue;
      }
      if (key === "capacity") {
        payload[key] = Number(value);
        continue;
      }
      payload[key] = String(value);
    }
    try {
      if (editing) {
        const { code: _code, ...updatePayload } = payload;
        await client.updateExamRoom(editing.id, updatePayload);
      } else {
        await client.createExamRoom(payload);
      }
      setShowForm(false);
      setEditing(null);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await client.deleteExamRoom(pendingDelete);
      setPendingDelete(null);
      await refetch();
    } catch {
      setError("Gagal menghapus");
    }
  }

  function openEdit(item: ExamRoomRecord) {
    setEditing(item);
    setShowForm(true);
  }

  const columns: DataTableColumn<ExamRoomRecord>[] = [
    { header: "Kode", key: "code", cell: (row) => <span className="font-mono font-bold">{row.code}</span> },
    { header: "Nama", key: "name" },
    { header: "Kapasitas", key: "capacity" },
    { header: "Lokasi", key: "location", cell: (row) => row.location ?? "-" },
    { header: "Status", key: "isActive", cell: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Ruangan"]}
        description="Kelola ruangan ujian."
        title="Ruangan Ujian"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      {showForm ? (
        <form className="max-w-lg rounded-xl border border-border bg-card p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kode</span>
              <Input name="code" defaultValue={editing?.code ?? ""} placeholder="R-001" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Nama</span>
              <Input name="name" defaultValue={editing?.name ?? ""} placeholder="Ruang 1" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kapasitas</span>
              <Input name="capacity" type="number" defaultValue={editing?.capacity ?? ""} placeholder="30" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Lokasi</span>
              <Input name="location" defaultValue={editing?.location ?? ""} placeholder="Gedung A Lt. 1" />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
            <input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} />
            Aktif
          </label>
          <div className="flex gap-3">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Update" : "Simpan"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              type="button"
              variant="outline"
            >
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      <DataTable
        actions={(row) => (
          <>
            <Button onClick={() => openEdit(row)} size="sm" variant="outline">
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
            <Button onClick={() => setPendingDelete(row.id)} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </>
        )}
        columns={columns}
        data={rooms}
        emptyState={{ title: "Belum ada ruangan", description: "Tambah ruangan ujian." }}
        getRowId={(row) => row.id}
        loading={loading}
      />

      <ConfirmDialog
        description="Hapus ruangan ini?"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus"
      />
    </div>
  );
}
