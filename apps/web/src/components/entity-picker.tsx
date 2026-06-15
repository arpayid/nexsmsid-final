"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, X } from "lucide-react";

import { cn, Input } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";
import { type EntityType, searchEntities } from "@/lib/entity-picker-config";

type EntityPickerProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  entityType: EntityType;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
};

export function EntityPicker({
  className,
  defaultValue = "",
  disabled,
  entityType,
  name,
  onChange,
  placeholder = "Cari dan pilih...",
  required,
  value: controlledValue,
}: EntityPickerProps) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pickedLabel, setPickedLabel] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const value = controlledValue ?? internalValue;
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setPickedLabel("");
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const loadLabel = useCallback(async () => {
    const items = await searchEntities(api, entityType, value, 50);
    const match = items.find((item) => item.id === value);
    return match?.label ?? "";
  }, [api, entityType, value]);

  const { data: labelData } = useApiQuery(loadLabel, [api, entityType, value], { enabled: Boolean(value) });
  const selectedLabel = !value ? "" : pickedLabel || labelData || "";

  const loadOptions = useCallback(async () => {
    return searchEntities(api, entityType, debouncedQuery, 20);
  }, [api, debouncedQuery, entityType]);

  const { data: optionsData, loading } = useApiQuery(loadOptions, [api, debouncedQuery, entityType], { enabled: open });
  const options = optionsData ?? [];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectOption(id: string, label: string) {
    setInternalValue(id);
    setPickedLabel(label);
    onChange?.(id);
    setOpen(false);
    setQuery("");
  }

  function clearSelection() {
    setInternalValue("");
    setPickedLabel("");
    onChange?.("");
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {name ? <input name={name} required={required} type="hidden" value={value} /> : null}
      <button
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-left text-sm shadow-sm outline-none",
          "focus:border-primary focus:ring-4 focus:ring-primary/10",
          disabled && "cursor-not-allowed opacity-60",
        )}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>{selectedLabel || placeholder}</span>
        <span className="flex items-center gap-1">
          {value ? (
            <span
              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                clearSelection();
              }}
              role="presentation"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-2 shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="h-9 pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ketik untuk mencari..."
              value={query}
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="grid place-items-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : options.length ? (
              options.map((option) => (
                <button
                  className={cn(
                    "flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                    option.id === value && "bg-primary/10 text-primary",
                  )}
                  key={option.id}
                  onClick={() => selectOption(option.id, option.label)}
                  type="button"
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Tidak ada hasil.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
