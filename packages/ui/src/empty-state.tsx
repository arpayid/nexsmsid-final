import { type ReactNode } from "react";

import { cn } from "./utils";

export type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-card p-8 text-center", className)}>
      {icon ? <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div> : null}
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
