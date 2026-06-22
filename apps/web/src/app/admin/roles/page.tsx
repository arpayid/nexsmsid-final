"use client";

import { useCallback, useMemo, useState } from "react";
import type { RoleSummary } from "@nexsmsid/api-client";
import { Button, ConfirmDialog, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";

import { PermissionGate } from "@/components/permission-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

export default function RolesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleSummary | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  const loadRoles = useCallback(async () => {
    void listVersion;
    const response = await api.roles();
    return response.data as RoleSummary[];
  }, [api, listVersion]);
  const { data, error, loading, refetch } = useApiQuery<RoleSummary[]>(loadRoles, [api]);

  const items = (data ?? []).filter((item) => {
    if (!search.trim()) return true;
    const n = search.toLowerCase();
    return item.name.toLowerCase().includes(n) || (item.slug ?? "").toLowerCase().includes(n);
  });

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setShowForm(true);
  }

  function openEdit(role: RoleSummary) {
    setEditTarget(role);
    setFormName(role.name);
    setFormDesc(role.description ?? "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.updateRole(editTarget.id, { name: formName, description: formDesc });
      } else {
        await api.createRole({ name: formName, description: formDesc });
      }
      setShowForm(false);
      setListVersion((v) => v + 1);
    } catch {
      alert("Gagal menyimpan role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      setListVersion((v) => v + 1);
    } catch {
      alert("Gagal menghapus role");
    }
  }

  return (
    <PermissionGate permission="roles.view">
      <div className="space-y-8">
        <PageHeader
          breadcrumb={["Admin", "Peran"]}
          description="Kelola peran dan izin akses pengguna."
          eyebrow="Pengaturan"
          title="Peran & Izin"
        />

        {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memuat peran" /> : null}

        <SectionCard
          action={
            <div className="flex gap-2">
              <SearchFilterBar
                onSearchChange={setSearch}
                onSubmit={(e) => e.preventDefault()}
                searchPlaceholder="Cari peran..."
                searchValue={search}
              />
              <PermissionGate permission="roles.create">
                <Button onClick={openCreate} size="sm">
                  + Tambah
                </Button>
              </PermissionGate>
            </div>
          }
          description={
            <>
              Peran sistem dan jumlah izin. Total: <strong>{items.length}</strong>.
            </>
          }
          title="Data Peran"
        >
          <DataTable
            columns={[
              { key: "name", header: "Nama" },
              { key: "slug", header: "Slug" },
              { key: "permissions", header: "Izin", cell: (item: RoleSummary) => String(item.permissions.length) },
              { key: "isActive", header: "Status", cell: (item: RoleSummary) => (item.isActive ? "Aktif" : "Nonaktif") },
              {
                key: "actions",
                header: "Aksi",
                cell: (item: RoleSummary) => (
                  <div className="flex gap-1">
                    <PermissionGate permission="roles.update">
                      <Button onClick={() => openEdit(item)} size="sm" variant="outline">
                        Edit
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="roles.delete">
                      <Button onClick={() => setDeleteTarget(item)} size="sm" variant="soft" className="text-rose-600">
                        Hapus
                      </Button>
                    </PermissionGate>
                  </div>
                ),
              },
            ]}
            data={items}
            emptyState={{ description: "Belum ada peran.", title: "Data kosong" }}
            getRowId={(item) => item.id}
            loading={loading}
          />
        </SectionCard>
      </div>

      {/* Create/Edit Form */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel={editTarget ? "Simpan" : "Buat"}
        description={
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Role</label>
              <input
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama role"
                value={formName}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deskripsi</label>
              <textarea
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Deskripsi role"
                rows={2}
                value={formDesc}
              />
            </div>
          </div>
        }
        onCancel={() => setShowForm(false)}
        onConfirm={() => void handleSave()}
        open={showForm}
        title={editTarget ? "Edit Role" : "Buat Role Baru"}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Hapus"
        description={`Hapus role "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        open={Boolean(deleteTarget)}
        title="Hapus Role"
      />
    </PermissionGate>
  );
}
