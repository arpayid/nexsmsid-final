"use client";

import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@nexsmsid/ui";

type PortalDashboardHeroProps = {
  description: string;
  eyebrow: string;
  loading?: boolean;
  onRefresh: () => void;
  title: string;
};

export function PortalDashboardHero({ description, eyebrow, loading, onRefresh, title }: PortalDashboardHeroProps) {
  return (
    <section className="dashboard-hero-banner relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-premium sm:px-8 sm:py-9">
      <div className="relative z-10 max-w-2xl">
        <p className="text-sm font-medium text-white/85">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">{description}</p>
        <div className="mt-5">
          <Button
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            disabled={loading}
            onClick={() => void onRefresh()}
            size="sm"
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Muat Ulang
          </Button>
        </div>
      </div>
    </section>
  );
}
