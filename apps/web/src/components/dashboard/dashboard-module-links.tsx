import {
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  GraduationCap,
  Landmark,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { SectionCard } from "@nexsmsid/ui";

import type { Overview } from "./dashboard-types";
import { formatNumber } from "./dashboard-utils";

type ModuleLink = {
  href: string;
  icon: LucideIcon;
  meta: string;
  title: string;
};

type DashboardModuleLinksProps = {
  overview: Overview;
};

export function DashboardModuleLinks({ overview }: DashboardModuleLinksProps) {
  const modules: ModuleLink[] = [
    { title: "Siswa", href: "/admin/students", icon: UsersRound, meta: `${formatNumber(overview.people.studentsActive)} aktif` },
    { title: "Guru", href: "/admin/teachers", icon: GraduationCap, meta: `${formatNumber(overview.people.teachersActive)} aktif` },
    {
      title: "Akademik",
      href: "/admin/academic/teaching-assignments",
      icon: BookOpenCheck,
      meta: `${formatNumber(overview.academic.subjects)} mapel`,
    },
    { title: "Keuangan", href: "/admin/finance", icon: Landmark, meta: `${formatNumber(overview.finance.verifiedPayments)} bayar OK` },
    { title: "PPDB", href: "/admin/ppdb", icon: Building2, meta: `${formatNumber(overview.ppdb.activeRegistrations)} pendaftar` },
    { title: "BKK", href: "/admin/bkk", icon: BriefcaseBusiness, meta: `${formatNumber(overview.programs.publishedJobs)} lowongan` },
  ];

  return (
    <SectionCard description="Akses cepat ke modul inti — tanpa menduplikasi menu sidebar." title="Pintasan Modul">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              className="group flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 px-3 py-3 transition hover:border-primary/25 hover:bg-primary/5"
              href={module.href}
              key={module.href}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{module.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{module.meta}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
