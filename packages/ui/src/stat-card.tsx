import { type ReactNode } from "react";

import { Card } from "./card";
import { cn } from "./utils";

type StatTone = "violet" | "blue" | "emerald" | "amber";

const toneClassName: Record<StatTone, string> = {
  violet: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900",
  blue: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
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

export function StatCard({ className, description, icon, title, tone = "violet", trend, value }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {icon ? <div className={cn("rounded-lg p-2.5 ring-1", toneClassName[tone])}>{icon}</div> : null}
      </div>
      {description || trend ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {trend ? <span className={cn("font-medium", trendClassName[trend.variant ?? "neutral"])}>{trend.value}</span> : null}
          <span className="text-muted-foreground">{trend?.label ?? description}</span>
        </div>
      ) : null}
    </Card>
  );
}
