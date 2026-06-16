import { type FormEvent, type ReactNode } from "react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "./utils";

export type SearchFilterOption = { label: string; value: string };

export type SearchFilter = {
  label?: string;
  onChange: (value: string) => void;
  options: SearchFilterOption[];
  placeholder?: string;
  value: string;
};

export type SearchFilterBarProps = {
  action?: ReactNode;
  className?: string;
  filters?: SearchFilter[];
  onSearchChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  searchPlaceholder?: string;
  searchValue: string;
  submitLabel?: string;
};

export function SearchFilterBar({
  action,
  className,
  filters,
  onSearchChange,
  onSubmit,
  searchPlaceholder = "Cari data...",
  searchValue,
  submitLabel = "Cari",
}: SearchFilterBarProps) {
  return (
    <form
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-card ring-1 ring-black/[0.03] lg:w-auto lg:flex-row lg:items-center lg:justify-end lg:p-2",
        className,
      )}
      onSubmit={onSubmit}
    >
      <div className="relative w-full lg:max-w-sm">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary/30 bg-primary/10" />
        <Input
          className="border-transparent bg-muted/40 pl-10 shadow-none focus:bg-card"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          value={searchValue}
        />
      </div>
      {(filters ?? []).map((filter, index) => (
        <label className="sr-only" key={`${filter.label ?? "filter"}-${index}`}>
          {filter.label ?? filter.placeholder ?? "Filter"}
        </label>
      ))}
      {(filters ?? []).map((filter, index) => (
        <select
          aria-label={filter.label ?? filter.placeholder ?? "Filter data"}
          className="h-10 rounded-lg border border-border/80 bg-muted/40 px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/15"
          key={`${filter.label ?? "filter"}-${index}-select`}
          onChange={(event) => filter.onChange(event.target.value)}
          value={filter.value}
        >
          <option value="">{filter.placeholder ?? "Semua"}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <Button type="submit" variant="soft">
        {submitLabel}
      </Button>
      {action}
    </form>
  );
}
