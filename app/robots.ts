import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Utility and internal pages that shouldn't show up in search results.
      disallow: [
        "/api/",
        "/success",
        "/cancel",
        "/manage-donation",
        "/color-preview",
        "/test-layouts",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
