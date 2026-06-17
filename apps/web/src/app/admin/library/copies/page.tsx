"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Barcode, Loader2, RefreshCcw } from "lucide-react";

import { Button, DataTable, ErrorState, PageHeader, SearchFilterBar, SectionCard, StatusBadge } from "@nexsmsid/ui";
import type { DataTableColumn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type LibraryCopyRow = {
  id: string;
  code?: string | null;
  status?: string | null;
  condition?: string | null;
  book?: { title?: string };
  shelf?: { name?: string };
};

export default function LibraryCopiesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCopies = useCallback(async () => {
    const res = await api.listAllCopies({ limit: 100, search: appliedSearch || undefined });
    return res.data ?? [];
  }, [api, appliedSearch]);
  const { data: copiesData, error: fetchError, loading, refetch } = useApiQuery<LibraryCopyRow[]>(loadCopies, [appliedSearch]);
  const copies = copiesData ?? [];
  const total = copies.length;
  const error = actionError ?? fetchError;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appliedSearch === search) {
      await refetch();
      return;
    }
    setAppliedSearch(search);
  }

  async function handlePrintLabel(copyId: string) {
    setActionError(null);
    setPrintingId(copyId);
    try {
      await api.downloadLibraryCopyLabelPdf(copyId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal mencetak label");
    } finally {
      setPrintingId(null);
    }
  }

  const columns: DataTableColumn<LibraryCopyRow>[] = [
    {
      cell: (item) => <span className="font-mono text-xs">{item.code || "-"}</span>,
      header: "Kode",
      key: "code",
    },
    {
      cell: (item) => item.book?.title || "-",
      header: "Judul Buku",
      key: "title",
    },
    {
      cell: (item) => <StatusBadge value={item.status || "AVAILABLE"} />,
      header: "Status",
      key: "status",
    },
    {
      cell: (item) => item.condition || "GOOD",
      header: "Kondisi",
      key: "condition",
    },
    {
      cell: (item) => item.shelf?.name || "-",
      header: "Lokasi",
      key: "shelf",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        }
        breadcrumb={["Admin", "Perpustakaan", "Eksemplar"]}
        description="Kelola eksemplar buku dan cetak barcode."
        eyebrow="Perpustakaan"
        title="Eksemplar Buku"
      />

      {error ? <ErrorState message={error} onRetry={() => void refetch()} title="Gagal memproses eksemplar" /> : null}

      <SectionCard
        action={
          <SearchFilterBar
            onSearchChange={setSearch}
            onSubmit={handleSearch}
            searchPlaceholder="Cari kode atau judul..."
            searchValue={search}
          />
        }
        description={
          <>
            Daftar eksemplar buku perpustakaan. Total: <strong>{total}</strong> data.
          </>
        }
        title="Data Eksemplar"
      >
        <DataTable
          actions={(copy) => (
            <Button disabled={printingId === copy.id} onClick={() => void handlePrintLabel(copy.id)} size="sm" variant="outline">
              {printingId === copy.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />} Label
            </Button>
          )}
          columns={columns}
          data={copies}
          emptyState={{
            description: "Belum ada data eksemplar atau hasil pencarian kosong.",
            title: "Data masih kosong",
          }}
          getRowId={(item) => item.id}
          loading={loading}
          minWidth="min-w-[760px]"
        />
      </SectionCard>
    </div>
  );
}
