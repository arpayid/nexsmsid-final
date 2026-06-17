"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import type { MasterDataRecord, PpdbPeriodRecord } from "@nexsmsid/api-client";
import { Badge, Button, ConfirmDialog, DataTable, ErrorState, FormModal, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type PeriodsData = {
  items: PpdbPeriodRecord[];
  total: number;
};

export default function PpdbPeriodsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [editing, setEditing] = useState<PpdbPeriodRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PpdbPeriodRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAcademicYears = useCallback(async () => {
    const yearsRes = await api.masterDataList("academic-years", { limit: 100 });
    return yearsRes.data;
  }, [api]);
  const { data: academicYearsData } = useApiQuery<MasterDataRecord[]>(loadAcademicYears, [api]);
  const academicYears = academicYearsData ?? [];

  const loadPeriods = useCallback(async () => {
    const response = await api.listPpdbPeriods({ limit: 50, page: 1, search: appliedSearch || undefined });
    const result = response as { items: PpdbPeriodRecord[]; meta?: { total?: number } };
    return { items: result.items, total: result.meta?.total ?? result.items.length };
  }, [api, appliedSearch]);
  const { data, error, loading, refetch, setError } = useApiQuery<PeriodsData>(loadPeriods, [api, appliedSearch]);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

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

  function openEdit(item: PpdbPeriodRecord) {
    setEditing(item);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    try {
      await api.deletePpdbPeriod(pendingDelete.id as string);
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
    const payload: Record<string, unknown> = {
      name: formData.get("name"),
      academicYearId: formData.get("academicYearId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      quota: Number(formData.get("quota")),
      isActive: formData.get("isActive") === "on",
    };
    try {
      if (editing) {
        await api.updatePpdbPeriod(editing.id as string, payload);
      } else {
        await api.createPpdbPeriod(payload);
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

  const activeAcademicYear = academicYears.find((y) => y.isActive);

  const columns: DataTableColumn<PpdbPeriodRecord>[] = [
    {
      cell: (item) => item.name as string,
      header: "Nama",
      key: "name",
    },
    {
      cell: (item) => ((item.academicYear as Record<string, unknown>)?.name as string) ?? "-",
      header: "Tahun Ajaran",
      key: "academicYear",
    },
    {
      cell: (item) => ((item.startDate as string) ? new Date(item.startDate as string).toLocaleDateString("id-ID") : "-"),
      header: "Tanggal Mulai",
      key: "startDate",
    },
    {
      cell: (item) => ((item.endDate as string) ? new Date(item.endDate as string).toLocaleDateString("id-ID") : "-"),
      header: "Tanggal Selesai",
      key: "endDate",
    },
    {
      cell: (item) => String(item.quota ?? "-"),
      header: "Kuota",
      key: "quota",
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
        breadcrumb={["Admin", "PPDB", "Periode"]}
        description="Atur periode pendaftaran PPDB."
        eyebrow="PPDB"
        title="Periode PPDB"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses periode PPDB" /> : null}

      <SectionCard
        action={
          <SearchFilterBar onSearchChange={setSearch} onSubmit={handleSearch} searchPlaceholder="Cari periode..." searchValue={search} />
        }
        description={
          <>
            Kelola periode pendaftaran. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Periode PPDB"
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
                Tambah periode pertama
              </Button>
            ),
            description: "Belum ada periode PPDB atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id as string}
          loading={loading}
          minWidth="min-w-[700px]"
        />
      </SectionCard>

      <FormModal
        description="Tentukan nama, tahun ajaran, rentang tanggal, dan kuota."
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={editing ? "Edit Periode PPDB" : "Tambah Periode PPDB"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Nama Periode</span>
            <input
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={(editing?.name as string) ?? ""}
              name="name"
              required
              type="text"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tahun Ajaran</span>
            <select
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={(editing?.academicYearId as string) ?? activeAcademicYear?.id ?? ""}
              name="academicYearId"
              required
            >
              <option disabled value="">
                Pilih Tahun Ajaran
              </option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal Mulai</span>
            <input
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={editing?.startDate ? new Date(editing.startDate as string).toISOString().split("T")[0] : ""}
              name="startDate"
              required
              type="date"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal Selesai</span>
            <input
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={editing?.endDate ? new Date(editing.endDate as string).toISOString().split("T")[0] : ""}
              name="endDate"
              required
              type="date"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kuota</span>
            <input
              className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue={(editing?.quota as number) ?? ""}
              min="1"
              name="quota"
              required
              type="number"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground">
            <input defaultChecked={(editing?.isActive as boolean) ?? true} name="isActive" type="checkbox" /> Aktif
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
        description={`Hapus periode PPDB ${pendingDelete ? (pendingDelete.name as string) : ""}?`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Konfirmasi hapus periode"
      />
    </div>
  );
}
