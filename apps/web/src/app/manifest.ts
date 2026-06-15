import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexSMSID - School Management System",
    short_name: "NexSMSID",
    description: "Platform manajemen sekolah dan dashboard operasional SMK/SMA terintegrasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#14997a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
