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
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Kelola sekolah dengan lebih efisien bersama NexAdmin</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          Pantau aktivitas akademik, kelola data siswa dan guru, serta tingkatkan produktivitas sekolah Anda.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="border-0 bg-white text-emerald-700 shadow-md hover:bg-white/95" size="sm">
            <Link href="/admin/reports">
              <BarChart3 className="h-4 w-4" /> Lihat Laporan
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
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(46%,22rem)] sm:block">
        <svg
          className="absolute bottom-0 right-2 h-full max-h-[12rem] w-auto opacity-95"
          viewBox="0 0 320 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="160" cy="182" fill="rgba(255,255,255,0.14)" rx="120" ry="14" />
          <rect fill="rgba(255,255,255,0.95)" height="78" rx="6" width="140" x="90" y="78" />
          <rect fill="rgba(255,255,255,0.88)" height="12" rx="2" width="18" x="118" y="98" />
          <rect fill="rgba(255,255,255,0.88)" height="12" rx="2" width="18" x="142" y="98" />
          <rect fill="rgba(255,255,255,0.88)" height="12" rx="2" width="18" x="166" y="98" />
          <rect fill="rgba(255,255,255,0.88)" height="12" rx="2" width="18" x="190" y="98" />
          <polygon fill="rgba(255,255,255,0.9)" points="90,78 160,28 230,78" />
          <rect fill="#10B981" height="32" rx="2" width="22" x="149" y="124" />
          <circle cx="248" cy="52" fill="rgba(255,255,255,0.35)" r="18" />
          <circle cx="268" cy="72" fill="rgba(255,255,255,0.2)" r="10" />
        </svg>
      </div>
    </section>
  );
}
