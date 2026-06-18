"use client";

import { BookOpen, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@nexsmsid/ui";

import { SkipToContent } from "@/components/skip-to-content";

type AuthPageShellProps = {
  badge?: string;
  children: ReactNode;
  description: string;
  heroIcon?: LucideIcon;
  heroTitle: string;
  highlights?: string[];
  tone?: "default" | "warning";
};

export function AuthPageShell({
  badge = "Enterprise SaaS 2026",
  children,
  description,
  heroIcon: HeroIcon = BookOpen,
  heroTitle,
  highlights = [],
  tone = "default",
}: AuthPageShellProps) {
  const heroClass =
    tone === "warning"
      ? "dashboard-hero-banner relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 p-10 text-white lg:flex"
      : "dashboard-hero-banner relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex";

  return (
    <>
      <SkipToContent />
      <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className={heroClass}>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/30">
              <HeroIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold">NexAdmin</p>
              <p className="text-sm text-white/80">Enterprise School Platform</p>
            </div>
          </div>
          <Badge className="mt-8 border-white/30 bg-white/15 text-white" variant="outline">
            <Sparkles className="mr-1.5 h-3 w-3" /> {badge}
          </Badge>
          <h1 className="mt-6 max-w-md text-3xl font-bold leading-tight tracking-tight">{heroTitle}</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/85">{description}</p>
          {highlights.length ? (
            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {highlights.map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <HeroIcon className="h-4 w-4 text-white" /> {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="relative z-10 text-xs text-white/70">NexAdmin © NexSMSID</p>
      </div>

      <div className="relative grid place-items-center px-4 py-10 sm:px-6 lg:px-8" id="main-content" tabIndex={-1}>
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-20 lg:left-1/2" aria-hidden="true" />
        <div className="w-full max-w-md animate-fade-up">
          <Link className="mx-auto mb-8 flex w-max items-center gap-3 lg:hidden" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-glow">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight text-foreground">NexAdmin</span>
              <span className="block text-xs text-muted-foreground">Enterprise Panel</span>
            </span>
          </Link>
          {children}
        </div>
      </div>
    </main>
    </>
  );
}
