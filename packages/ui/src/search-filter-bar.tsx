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
    <form className={cn("flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end", className)} onSubmit={onSubmit}>
      <div className="relative w-full lg:max-w-sm">
        <span className="pointer-events-none absolute left-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary/60" />
        <Input
          className="pl-9"
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
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
