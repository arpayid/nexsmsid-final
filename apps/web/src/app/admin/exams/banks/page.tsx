"use client";

import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button, DataTable, ErrorState, Input, PageHeader } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type ExamBankRow = {
  id: string;
  name: string;
  description?: string | null;
};

export default function ExamBanksPage() {
  const client = useMemo(() => createBrowserApiClient(), []);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadBanks = useCallback(async () => {
    const res = await client.listExamBanks({ limit: 100 });
    return res.data;
  }, [client]);

  const { data, error, loading, refetch, setError } = useApiQuery<ExamBankRow[]>(loadBanks, [client]);
  const banks = data ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await client.createExamBank({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setShowForm(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat bank soal");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<ExamBankRow>[] = [
    { header: "Nama", key: "name" },
    { header: "Deskripsi", key: "description", cell: (row) => row.description ?? "-" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
        breadcrumb={["Admin", "Ujian / CBT", "Bank Soal"]}
        description="Kelola bank soal."
        title="Bank Soal"
      />

      {error ? <ErrorState message={error} title="Gagal" /> : null}

      {showForm ? (
        <form className="max-w-lg rounded-xl border border-border bg-card p-6 space-y-4" onSubmit={handleCreate}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Nama Bank Soal</span>
            <Input placeholder="Bank Soal Matematika" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Deskripsi</span>
            <textarea
              className="w-full min-h-20 rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="flex gap-3">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setShowForm(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        data={banks}
        emptyState={{ title: "Belum ada bank soal", description: "Tambah bank soal pertama." }}
        getRowId={(row) => row.id}
        loading={loading}
      />
    </div>
  );
}
