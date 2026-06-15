import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicMetadata } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata("Cek Status PPDB", "Pantau status pendaftaran dan unggah berkas PPDB.");
}

export default function PpdbStatusLayout({ children }: { children: ReactNode }) {
  return children;
}
