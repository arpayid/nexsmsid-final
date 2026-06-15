import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicMetadata } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata("Lowongan Kerja", "Lowongan kerja dan magang dari mitra industri sekolah.");
}

export default function JobsLayout({ children }: { children: ReactNode }) {
  return children;
}
