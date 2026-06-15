"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Users } from "lucide-react";

import { cn } from "@nexsmsid/ui";

import { createBrowserApiClient } from "@/lib/api-client";
import { getStoredChildId, setStoredChildId, clearStoredChildIdIfForbidden } from "@/lib/guardian-preferences";

type Child = {
  id: string;
  nis: string;
  name: string;
  classroom?: { name: string } | null;
  isPrimary: boolean;
};

export function ChildSelector({ onChange }: { onChange?: (childId: string) => void }) {
  const [items, setItems] = useState<Child[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApiClient();
        const data = (await api.getGuardianPortalChildren()) as Child[];
        if (!active) return;
        setItems(data);
        const stored = getStoredChildId();
        if (stored && data.some((c) => c.id === stored)) {
          setSelected(stored);
          onChange?.(stored);
        } else if (data.length > 0) {
          const primary = data.find((c) => c.isPrimary);
          const defaultId = primary?.id ?? data[0].id;
          setSelected(defaultId);
          setStoredChildId(defaultId);
          onChange?.(defaultId);
        }
      } catch (error) {
        clearStoredChildIdIfForbidden(error);
        if (active) {
          // ignore: parent will render empty state
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [onChange]);

  if (loading) {
    return <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Memuat data anak...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Tidak ada anak yang terhubung dengan akun wali.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <Users className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Anak</span>
      <div className="relative">
        <select
          aria-label="Pilih anak"
          className={cn(
            "appearance-none rounded-xl border border-border bg-card px-3 py-1 pr-8 text-sm font-semibold text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary",
          )}
          value={selected ?? ""}
          onChange={(event) => {
            const id = event.target.value;
            setSelected(id);
            setStoredChildId(id);
            onChange?.(id);
          }}
        >
          {items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.isPrimary ? "(wali utama)" : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
