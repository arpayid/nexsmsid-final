"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

import { Button, DataTable, ErrorState, FormModal, Input, PageHeader, SectionCard } from "@nexsmsid/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type HRPositionRow = {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
};

export default function HRPositionsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    const response = await api.listHRPositions({ limit: 50, page: 1 });
    return (response as { data?: HRPositionRow[] }).data || [];
  }, [api]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<HRPositionRow[]>(loadItems, [api]);
  const items = itemsData ?? [];
  const error = actionError ?? fetchError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      isActive: formData.get("isActive") === "on",
    };

    try {
      await api.createHRPosition(payload);
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan jabatan");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "code", header: "Kode", cell: (item: HRPositionRow) => String(item.code ?? "-") },
    { key: "name", header: "Nama Jabatan", cell: (item: HRPositionRow) => String(item.name ?? "-") },
    { key: "description", header: "Deskripsi", cell: (item: HRPositionRow) => String(item.description ?? "-") },
    { key: "isActive", header: "Status", cell: (item: HRPositionRow) => (item.isActive ? "Aktif" : "Nonaktif") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jabatan HR"
        description="Kelola posisi dan jabatan pegawai."
        breadcrumb={["Admin", "HR & Payroll", "Jabatan"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Jabatan
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Daftar Jabatan HR">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada jabatan HR." }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Jabatan">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Kode Jabatan</span>
            <Input name="code" placeholder="Misal: TCHR, STF" required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Nama Jabatan</span>
            <Input name="name" placeholder="Misal: Guru Mapel, Staf TU" required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Deskripsi</span>
            <Input name="description" placeholder="Penjelasan singkat..." />
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
            <input defaultChecked name="isActive" type="checkbox" /> Aktif
          </label>
          <div className="flex gap-3">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
