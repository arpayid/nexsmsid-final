import { type ReactNode } from "react";

import { cn } from "./utils";

export type LoadingStateProps = {
  className?: string;
  description?: ReactNode;
  label?: ReactNode;
  minHeight?: string;
};

export function LoadingState({ className, description, label = "Memuat data...", minHeight = "min-h-48" }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center",
        minHeight,
        className,
      )}
    >
      <div>
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
