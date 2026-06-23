import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NexAdmin — NexSMSID",
    template: "%s | NexAdmin",
  },
  description: "Panel administrasi sekolah modern berbasis NexAdmin untuk SMK dan sekolah.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "NexAdmin — NexSMSID",
    description: "Panel administrasi sekolah modern berbasis NexAdmin untuk SMK dan sekolah.",
    type: "website",
    locale: "id_ID",
    siteName: "NexAdmin",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexAdmin — NexSMSID",
    description: "Panel administrasi sekolah modern berbasis NexAdmin untuk SMK dan sekolah.",
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("nexsmsid.theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
