"use client";

import { BarChart3, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@nexsmsid/ui";

type DashboardHeroProps = {
  loading?: boolean;
  onRefresh: () => void;
};

export function DashboardHero({ loading, onRefresh }: DashboardHeroProps) {
  return (
    <section className="dashboard-hero-banner relative overflow-hidden rounded-2xl px-6 py-8 text-white shadow-premium sm:px-8 sm:py-10">
      <div className="relative z-10 max-w-2xl">
        <p className="text-sm font-medium text-white/85">Dashboard Operasional</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Selamat datang di NexAdmin 👋</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          Ringkasan operasional sekolah — akademik, keuangan, PPDB, dan peringatan yang perlu ditindaklanjuti.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="border-0 bg-white text-emerald-700 shadow-md hover:bg-white/95" size="sm">
            <Link href="/admin/reports">
              <BarChart3 className="h-4 w-4" /> Laporan
            </Link>
          </Button>
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
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(42%,20rem)] sm:block">
        <svg
          className="absolute bottom-0 right-4 h-full max-h-[11rem] w-auto opacity-95"
          viewBox="0 0 280 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="140" cy="165" fill="rgba(255,255,255,0.15)" rx="110" ry="12" />
          <rect fill="rgba(255,255,255,0.92)" height="70" rx="4" width="120" x="80" y="70" />
          <polygon fill="rgba(255,255,255,0.85)" points="80,70 140,25 200,70" />
          <rect fill="#10B981" height="28" width="18" x="131" y="112" />
        </svg>
      </div>
    </section>
  );
}
