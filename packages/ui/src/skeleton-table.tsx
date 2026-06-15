import { cn } from "./utils";

export type SkeletonTableProps = {
  className?: string;
  rows?: number;
  cols?: number;
};

export function SkeletonTable({ className, rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <div className="grid gap-4 border-b border-border bg-muted/60 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 border-b border-border p-4 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={cn("h-4 animate-pulse rounded-md bg-muted", c === 0 ? "w-4/5" : "w-3/5")} />
          ))}
        </div>
      ))}
    </div>
  );
}
