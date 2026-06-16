import { type ReactNode } from "react";

import { Button } from "./button";
import { cn } from "./utils";

export type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  title?: ReactNode;
};

export function ErrorState({
  action,
  className,
  message,
  onRetry,
  retryLabel = "Coba lagi",
  title = "Terjadi kesalahan",
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-semibold dark:bg-rose-900/50">
            !
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {message ? <p className="mt-1 text-sm leading-6 text-rose-700 dark:text-rose-300">{message}</p> : null}
          </div>
        </div>
        {action ??
          (onRetry ? (
            <Button onClick={onRetry} size="sm" variant="outline">
              {retryLabel}
            </Button>
          ) : null)}
      </div>
    </div>
  );
}
