"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard, cn } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { getStoredChildId, setStoredChildId, clearStoredChildIdIfForbidden } from "@/lib/guardian-preferences";

type Child = {
  id: string;
  nis: string;
  nisn?: string | null;
  name: string;
  classroom?: { name: string; competency?: { name: string } | null } | null;
  isPrimary: boolean;
};

export default function GuardianChildrenPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    try {
      return (await api.getGuardianPortalChildren()) as Child[];
    } catch (err) {
      clearStoredChildIdIfForbidden(err);
      throw err;
    }
  }, [api]);

  const { data: itemsData, error, loading } = useApiQuery(loadChildren, [api]);
  const items = useMemo(() => itemsData ?? [], [itemsData]);

  const resolvedSelected = useMemo(() => {
    if (!items.length) return null;
    if (selectedOverride && items.some((c) => c.id === selectedOverride)) return selectedOverride;
    const stored = getStoredChildId();
    if (stored && items.some((c) => c.id === stored)) return stored;
    const primary = items.find((c) => c.isPrimary);
    return primary?.id ?? items[0].id;
  }, [items, selectedOverride]);

  function selectChild(childId: string) {
    setSelectedOverride(childId);
    setStoredChildId(childId);
  }

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error) return <ErrorState message={error} title="Gagal memuat data anak" />;
  if (items.length === 0) return <EmptyState description="Belum ada anak yang terhubung." title="Belum ada anak" />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Wali", "Anak"]}
        description="Pilih anak untuk melihat detailnya. Pilihan akan dipakai di halaman Presensi, Nilai, dan Tagihan."
        eyebrow="Portal Wali"
        title="Anak Anda"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => {
          const isActive = resolvedSelected === c.id;
          return (
            <button key={c.id} onClick={() => selectChild(c.id)} className="text-left" type="button">
              <SectionCard
                className={cn("transition-shadow hover:shadow-elevated", isActive && "ring-2 ring-primary")}
                title={
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> {c.name}
                    {c.isPrimary ? <Badge variant="success">Wali Utama</Badge> : null}
                  </span>
                }
              >
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">NIS</p>
                    <p className="font-semibold">{c.nis}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">NISN</p>
                    <p className="font-semibold">{c.nisn ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Kelas</p>
                    <p className="font-semibold">{c.classroom?.name ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Kompetensi</p>
                    <p className="font-semibold">{c.classroom?.competency?.name ?? "-"}</p>
                  </div>
                </div>
              </SectionCard>
            </button>
          );
        })}
      </div>
      <SectionCard description="Anak yang sedang dipilih dipakai di halaman lain." title="Pilihan Aktif">
        {resolvedSelected ? (
          <p className="text-sm text-muted-foreground">
            Sedang melihat data untuk: <span className="font-semibold">{items.find((c) => c.id === resolvedSelected)?.name ?? "-"}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Pilih salah satu anak di atas.</p>
        )}
      </SectionCard>
    </div>
  );
}
