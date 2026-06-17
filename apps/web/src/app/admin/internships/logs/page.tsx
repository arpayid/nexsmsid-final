"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, Loader2, Plus, RefreshCcw, XCircle } from "lucide-react";

import { Badge, Button, DataTable, ErrorState, FormModal, Input, PageHeader, SearchFilterBar, SectionCard } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { options, statusMap } from "@/components/phase9-resource-page";

type Row = Record<string, unknown>;
const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];
const badges = statusMap(statuses);

export default function InternshipLogsPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [internshipId, setInternshipId] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadInternships = useCallback(async () => {
    const response = await api.listInternships({ limit: 100 });
    return response.items;
  }, [api]);

  const { data: internshipsData, error: internshipsError, refetch: refetchInternships } = useApiQuery(loadInternships, [api]);
  const internships = internshipsData ?? [];
  const resolvedInternshipId = internshipId || (internships[0]?.id as string) || "";

  const loadLogs = useCallback(async () => {
    if (!resolvedInternshipId) return [];
    const response = await api.listInternshipLogs(resolvedInternshipId, { limit: 50, search: appliedSearch || undefined });
    return response.items;
  }, [api, resolvedInternshipId, appliedSearch]);

  const {
    data: itemsData,
    error: logsError,
    loading,
    refetch: refetchLogs,
  } = useApiQuery(loadLogs, [api, resolvedInternshipId, appliedSearch], {
    enabled: Boolean(resolvedInternshipId),
  });
  const items = itemsData ?? [];

  const error = actionError ?? internshipsError ?? logsError;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    await refetchLogs();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedInternshipId) return;
    const formData = new FormData(event.currentTarget);
    setActionError(null);
    try {
      await api.createInternshipLog(resolvedInternshipId, {
        date: formData.get("date"),
        activity: formData.get("activity"),
        obstacle: formData.get("obstacle") || undefined,
        solution: formData.get("solution") || undefined,
        status: formData.get("status") || "SUBMITTED",
      });
      setFormOpen(false);
      await refetchLogs();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Gagal menambah jurnal");
    }
  }

  async function runAction(id: string, action: "approve" | "reject") {
    setActionError(null);
    try {
      if (action === "approve") await api.approveInternshipLog(id);
      else await api.rejectInternshipLog(id, { note: "Ditolak dari UI admin" });
      await refetchLogs();
    } catch (actionErr) {
      setActionError(actionErr instanceof Error ? actionErr.message : "Aksi gagal");
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: "date",
      header: "Tanggal",
      cell: (item) => String(item.date ?? "-").slice(0, 10),
    },
    {
      key: "activity",
      header: "Aktivitas",
      cell: (item) => String(item.activity ?? "-"),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const badge = badges[String(item.status)] ?? { label: String(item.status), variant: "outline" as const };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetchLogs()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button disabled={!resolvedInternshipId} onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Jurnal
            </Button>
          </>
        }
        breadcrumb={["Admin", "PKL", "Jurnal PKL"]}
        description="Kelola jurnal kegiatan PKL siswa."
        eyebrow="PKL"
        title="Jurnal PKL"
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void refetchInternships();
            void refetchLogs();
          }}
          title="Gagal memproses jurnal PKL"
        />
      ) : null}

      <SectionCard
        action={
          <SearchFilterBar
            filters={[
              {
                label: "Data PKL",
                onChange: setInternshipId,
                options: internships.map((item) => ({
                  label: String((item as Row).title ?? item.id),
                  value: item.id as string,
                })),
                placeholder: "Pilih PKL",
                value: resolvedInternshipId,
              },
            ]}
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari aktivitas..."
            searchValue={search}
          />
        }
        description="Pilih data PKL untuk melihat dan mengelola jurnal kegiatan."
        title="Daftar Jurnal"
      >
        <DataTable
          actions={(item) =>
            item.status === "SUBMITTED" ? (
              <>
                <Button onClick={() => void runAction(item.id as string, "approve")} size="sm" variant="soft">
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
                <Button onClick={() => void runAction(item.id as string, "reject")} size="sm" variant="ghost">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </>
            ) : null
          }
          columns={columns}
          data={items}
          emptyState={{
            description: "Tambahkan jurnal untuk data PKL terpilih.",
            title: "Belum ada jurnal",
          }}
          getRowId={(item) => item.id as string}
          loading={loading}
          minWidth="min-w-[800px]"
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Jurnal">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Tanggal</span>
            <Input name="date" required type="date" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Status</span>
            <select
              className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm font-semibold shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue="SUBMITTED"
              name="status"
            >
              {options(statuses.slice(0, 2)).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-foreground">Aktivitas</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold shadow-sm outline-none transition-all focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              name="activity"
              placeholder="Aktivitas"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Kendala</span>
            <Input name="obstacle" placeholder="Kendala" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Solusi</span>
            <Input name="solution" placeholder="Solusi" />
          </label>
          <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button type="submit">Simpan Jurnal</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
