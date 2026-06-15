"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, Loader2, RefreshCcw, Search, XCircle } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ErrorState, Input, PageHeader } from "@nexsmsid/ui";

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
  const [actionError, setActionError] = useState<string | null>(null);

  const loadInternships = useCallback(async () => {
    const response = await api.listInternships({ limit: 100 });
    return response.items;
  }, [api]);

  const { data: internshipsData, error: internshipsError } = useApiQuery(loadInternships, [api]);
  const internships = internshipsData ?? [];
  const resolvedInternshipId = internshipId || (internships[0]?.id as string) || "";

  const loadLogs = useCallback(async () => {
    if (!resolvedInternshipId) return [];
    const response = await api.listInternshipLogs(resolvedInternshipId, { limit: 50, search: search || undefined });
    return response.items;
  }, [api, resolvedInternshipId, search]);

  const {
    data: itemsData,
    error: logsError,
    loading,
    refetch: refetchLogs,
  } = useApiQuery(loadLogs, [api, resolvedInternshipId, search], {
    enabled: Boolean(resolvedInternshipId),
  });
  const items = itemsData ?? [];

  const error = actionError ?? internshipsError ?? logsError;

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
      event.currentTarget.reset();
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

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["Admin", "PKL", "Jurnal PKL"]}
        description="Kelola jurnal kegiatan PKL siswa."
        eyebrow="PKL"
        title="Jurnal PKL"
      />
      {error ? <ErrorState message={error} title="Gagal memproses jurnal PKL" /> : null}

      <Card>
        <CardHeader>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <CardTitle>Filter Jurnal</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Pilih data PKL untuk melihat jurnal.</p>
            </div>
            <form
              className="flex flex-col gap-3 lg:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void refetchLogs();
              }}
            >
              <select
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold"
                onChange={(event) => setInternshipId(event.target.value)}
                value={resolvedInternshipId}
              >
                {internships.map((item) => (
                  <option key={item.id as string} value={item.id as string}>
                    {String((item as Row).title ?? item.id)}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-11" onChange={(event) => setSearch(event.target.value)} placeholder="Cari aktivitas" value={search} />
              </div>
              <Button type="submit" variant="soft">
                Cari
              </Button>
              <Button onClick={() => void refetchLogs()} type="button" variant="outline">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid min-h-40 place-items-center rounded-xl border border-dashed bg-surface-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Aktivitas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const badge = badges[String(item.status)] ?? { label: String(item.status), variant: "outline" as const };
                    return (
                      <tr className="border-b last:border-0" key={item.id as string}>
                        <td className="px-4 py-4 font-semibold">{String(item.date ?? "-").slice(0, 10)}</td>
                        <td className="px-4 py-4 font-semibold">{String(item.activity ?? "-")}</td>
                        <td className="px-4 py-4">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {item.status === "SUBMITTED" ? (
                              <>
                                <Button onClick={() => void runAction(item.id as string, "approve")} size="sm" variant="soft">
                                  <CheckCircle className="h-4 w-4" /> Approve
                                </Button>
                                <Button onClick={() => void runAction(item.id as string, "reject")} size="sm" variant="ghost">
                                  <XCircle className="h-4 w-4" /> Reject
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Belum ada jurnal" description="Tambahkan jurnal untuk data PKL terpilih." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Jurnal</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Input name="date" required type="date" />
            <select
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold"
              name="status"
              defaultValue="SUBMITTED"
            >
              {options(statuses.slice(0, 2)).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-24 rounded-xl border border-border px-4 py-3 text-sm font-semibold md:col-span-2"
              name="activity"
              placeholder="Aktivitas"
              required
            />
            <Input name="obstacle" placeholder="Kendala" />
            <Input name="solution" placeholder="Solusi" />
            <div className="flex justify-end md:col-span-2">
              <Button type="submit">Simpan Jurnal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
