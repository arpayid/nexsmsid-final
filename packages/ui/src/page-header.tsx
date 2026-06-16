import { type ReactNode } from "react";

import { cn } from "./utils";

export type PageHeaderProps = {
  actions?: ReactNode;
  breadcrumb?: string[];
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({ actions, breadcrumb, className, description, eyebrow, title }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "animate-fade-up flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between sm:border-b sm:border-border/60 sm:pb-6",
        className,
      )}
    >
      <div>
        {breadcrumb?.length ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <span className="flex items-center gap-1.5" key={`${item}-${index}`}>
                {index > 0 ? <span className="text-border">/</span> : null}
                <span className={index === breadcrumb.length - 1 ? "text-foreground" : undefined}>{item}</span>
              </span>
            ))}
          </div>
        ) : null}
        {eyebrow ? (
          <p className="mb-1 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
