import { type ReactNode } from "react";

import { cn } from "./utils";

type ModuleTone = "violet" | "blue" | "cyan" | "emerald" | "amber" | "slate";

const toneClassName: Record<ModuleTone, string> = {
  violet:
    "bg-indigo-50 text-indigo-700 ring-indigo-100 group-hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900 dark:group-hover:bg-indigo-900",
  blue: "bg-sky-50 text-sky-700 ring-sky-100 group-hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900 dark:group-hover:bg-sky-900",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100 group-hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-900 dark:group-hover:bg-cyan-900",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 group-hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900 dark:group-hover:bg-emerald-900",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-100 group-hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900 dark:group-hover:bg-amber-900",
  slate: "bg-muted text-muted-foreground ring-border group-hover:bg-muted/80",
};

export type ModuleCardProps = {
  className?: string;
  description: string;
  href?: string;
  icon?: ReactNode;
  meta?: string;
  title: string;
  tone?: ModuleTone;
};

export function ModuleCard({ className, description, href, icon, meta, title, tone = "violet" }: ModuleCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        {icon ? <div className={cn("rounded-lg p-2.5 ring-1 transition-colors", toneClassName[tone])}>{icon}</div> : null}
        {meta ? <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{meta}</span> : null}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </>
  );

  const classes = cn(
    "group block rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-150 hover:border-primary/30 hover:shadow-elevated",
    className,
  );

  if (href) {
    return (
      <a className={classes} href={href}>
        {content}
      </a>
    );
  }

  return <div className={classes}>{content}</div>;
}
