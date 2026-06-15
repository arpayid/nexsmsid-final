import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicMetadata } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata("Formulir PPDB", "Formulir pendaftaran peserta didik baru secara daring.");
}

export default function PpdbRegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
