import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The Rosh Hashanah / Tishrei campaign page was removed 2026-10-09. Old
    // links (already sent out, bookmarked, indexed) land on the regular donate
    // page rather than a 404. Next matches these case-insensitively, so
    // /Tishrei, /TISHREI etc. are covered too.
    return [
      { source: "/tishrei", destination: "/donate", permanent: false },
      { source: "/RoshHashanah", destination: "/donate", permanent: false },
    ];
  },
};

export default nextConfig;
