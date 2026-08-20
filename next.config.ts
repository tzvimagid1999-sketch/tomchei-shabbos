import type { NextConfig } from "next";
import { CAMPAIGN_MODE, CAMPAIGN_PATH } from "./app/lib/site-config";

const nextConfig: NextConfig = {
  async redirects() {
    // While the campaign is running, send anyone who lands on the general
    // donate page (old links, bookmarks, search results) to the campaign page
    // instead. Flip CAMPAIGN_MODE in app/lib/site-config.ts to turn this off.
    if (!CAMPAIGN_MODE) return [];
    return [
      {
        source: "/donate",
        destination: CAMPAIGN_PATH,
        permanent: false, // temporary — the donate page comes back after the campaign
      },
    ];
  },
};

export default nextConfig;
