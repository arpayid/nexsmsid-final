import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicMetadata } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata("Pengumuman", "Informasi dan pengumuman resmi sekolah.");
}

export default function AnnouncementsLayout({ children }: { children: ReactNode }) {
  return children;
}
