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
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {breadcrumb?.length ? (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <span className="flex items-center gap-2" key={`${item}-${index}`}>
                {index > 0 ? <span>/</span> : null}
                <span>{item}</span>
              </span>
            ))}
          </div>
        ) : null}
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
