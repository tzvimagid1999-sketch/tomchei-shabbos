import type { MetadataRoute } from "next";

export const SITE_URL = "https://tomcheishabbosflorida.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1.0 },
    { path: "/donate", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/apply-for-assistance", priority: 0.8 },
    { path: "/volunteer", priority: 0.7 },
    { path: "/blog", priority: 0.6 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  }));
}
