import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexsmsid.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/ppdb", "/jobs", "/announcements"],
      disallow: ["/admin", "/student", "/teacher", "/guardian", "/account", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
