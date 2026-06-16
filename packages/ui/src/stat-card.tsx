import { type ReactNode } from "react";

import { cn } from "./utils";

type StatTone = "violet" | "blue" | "emerald" | "amber" | "teal" | "indigo";

const toneClassName: Record<StatTone, { icon: string; accent: string }> = {
  teal: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    accent: "from-emerald-500 to-teal-500",
  },
  indigo: {
    icon: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900",
    accent: "from-indigo-500 to-indigo-600",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
    accent: "from-violet-500 to-violet-600",
  },
  blue: {
    icon: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
    accent: "from-sky-500 to-sky-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    accent: "from-emerald-500 to-emerald-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    accent: "from-amber-500 to-amber-600",
  },
};

const trendClassName = {
  positive: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-muted-foreground",
  negative: "text-rose-600 dark:text-rose-400",
} as const;

export type StatCardProps = {
  className?: string;
  description?: string;
  icon?: ReactNode;
  title: string;
  tone?: StatTone;
  trend?: {
    label: string;
    value: string;
    variant?: keyof typeof trendClassName;
  };
  value: string;
};

export function StatCard({ className, description, icon, title, tone = "teal", trend, value }: StatCardProps) {
  const palette = toneClassName[tone];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-card ring-1 ring-black/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated dark:ring-white/[0.04]",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80", palette.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {icon ? <div className={cn("rounded-xl p-2.5 ring-1 transition-transform group-hover:scale-105", palette.icon)}>{icon}</div> : null}
      </div>
      {description || trend ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-sm">
          {trend ? <span className={cn("font-semibold", trendClassName[trend.variant ?? "neutral"])}>{trend.value}</span> : null}
          <span className="text-muted-foreground">{trend?.label ?? description}</span>
        </div>
      ) : null}
    </div>
  );
}
