import { type ReactNode } from "react";

import { EmptyState, type EmptyStateProps } from "./empty-state";
import { LoadingState } from "./loading-state";
import { cn } from "./utils";

export type DataTableColumn<TRow> = {
  cell?: (row: TRow) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
  key: string;
};

export type DataTableProps<TRow> = {
  actions?: (row: TRow) => ReactNode;
  className?: string;
  columns: DataTableColumn<TRow>[];
  data: TRow[];
  emptyState?: EmptyStateProps;
  getRowId: (row: TRow, index: number) => string;
  loading?: boolean;
  minWidth?: string;
  rowClassName?: (row: TRow, index: number) => string | undefined;
};

export function DataTable<TRow>({
  actions,
  className,
  columns,
  data,
  emptyState,
  getRowId,
  loading,
  minWidth = "min-w-[860px]",
  rowClassName,
}: DataTableProps<TRow>) {
  if (loading) return <LoadingState />;

  if (!data.length) {
    return <EmptyState description="Belum ada data untuk filter saat ini." title="Data masih kosong" {...emptyState} />;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className={cn("w-full text-left text-sm", minWidth)}>
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {columns.map((column) => (
                <th className={cn("px-4 py-3.5", column.headerClassName)} key={column.key}>
                  {column.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3.5 text-right">Aksi</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-primary/[0.03]",
                  index % 2 === 1 && "bg-muted/20",
                  rowClassName?.(row, index),
                )}
                key={getRowId(row, index)}
              >
                {columns.map((column) => (
                  <td className={cn("px-4 py-3.5 align-middle text-foreground/90", column.className)} key={column.key}>
                    {column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? "-")}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-wrap justify-end gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
