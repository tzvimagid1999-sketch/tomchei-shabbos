import type { MetadataRoute } from "next";
import { CAMPAIGN_MODE } from "./lib/site-config";

export const SITE_URL = "https://tomcheishabbosflorida.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1.0 },
    { path: "/RoshHashanah", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/apply-for-assistance", priority: 0.8 },
    { path: "/volunteer", priority: 0.7 },
    { path: "/blog", priority: 0.6 },
  ];

  // While the campaign is running /donate redirects, so leave it out — Google
  // shouldn't be pointed at a URL that just bounces. It returns automatically
  // once CAMPAIGN_MODE is switched off.
  if (!CAMPAIGN_MODE) {
    pages.push({ path: "/donate", priority: 0.9 });
  }

  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/RoshHashanah" ? "daily" : "monthly",
    priority,
  }));
}
