"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { PageHeader, SectionCard, DataTable, Button, ErrorState, FormModal, Input, SearchFilterBar } from "@nexsmsid/ui";
import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

type EmployeeRow = {
  id: string;
  employeeCode?: string;
  fullName?: string;
  position?: { name?: string };
  employmentType?: string;
  status?: string;
};

export default function Page() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const client = useMemo(() => createBrowserApiClient(), []);

  const loadItems = useCallback(async () => {
    const response = await client.listEmployees({ limit: 50, page: 1, search: appliedSearch || undefined });
    return (response as { data?: EmployeeRow[] }).data || [];
  }, [client, appliedSearch]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<EmployeeRow[]>(loadItems, [client, appliedSearch]);
  const items = itemsData ?? [];
  const error = actionError ?? fetchError;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    await refetch();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      employeeCode: formData.get("employeeCode") as string,
      fullName: formData.get("fullName") as string,
      positionId: (formData.get("positionId") as string) || undefined,
      employmentType: (formData.get("employmentType") as string) || "PERMANENT",
      status: (formData.get("status") as string) || "ACTIVE",
      basicSalary: Number(formData.get("basicSalary") || 0),
    };

    try {
      await client.createEmployee(payload);
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan data pegawai");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "employeeCode", header: "Kode Pegawai", cell: (item: EmployeeRow) => String(item.employeeCode ?? "-") },
    { key: "fullName", header: "Nama Lengkap", cell: (item: EmployeeRow) => String(item.fullName ?? "-") },
    { key: "position", header: "Jabatan", cell: (item: EmployeeRow) => String(item.position?.name ?? "-") },
    { key: "employmentType", header: "Tipe", cell: (item: EmployeeRow) => String(item.employmentType ?? "-") },
    { key: "status", header: "Status", cell: (item: EmployeeRow) => String(item.status ?? "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Data Pegawai"
        description="Manajemen data pegawai."
        breadcrumb={["Admin", "HR & Payroll", "Data Pegawai"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari pegawai..." searchValue={search} />
        }
        title="Daftar Data Pegawai"
      >
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{
            title: "Data kosong",
            description: "Belum ada data data pegawai.",
          }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Pegawai">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Kode Pegawai</span>
              <Input name="employeeCode" placeholder="Misal: EMP001" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Nama Lengkap</span>
              <Input name="fullName" placeholder="Nama lengkap pegawai" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jabatan</span>
              <EntityPicker entityType="hr-position" name="positionId" placeholder="Cari jabatan..." />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Tipe Pegawai</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="employmentType"
                defaultValue="PERMANENT"
              >
                <option value="PERMANENT">Tetap</option>
                <option value="CONTRACT">Kontrak</option>
                <option value="INTERN">Magang</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Gaji Pokok</span>
              <Input name="basicSalary" type="number" defaultValue="0" min="0" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Status</span>
              <select
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                name="status"
                defaultValue="ACTIVE"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
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
