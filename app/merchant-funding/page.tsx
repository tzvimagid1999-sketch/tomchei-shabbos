import MerchantFundingPage from "./MerchantFundingPage";

export const metadata = {
  title: "Merchant Funding Community Campaign | Tomchei Shabbos of Florida",
  description:
    "The merchant funding community is raising $50,000 for Tomchei Shabbos of Florida, which delivers food to local families every week.",
  // Unlisted: reachable only by direct link, never through the site or search.
  robots: { index: false, follow: false },
};

// REVERTED 2026-09-09: this page used to await the donor list and total here
// (Promise.all of two paged USAePay crawls) so both were already in the first
// HTML instead of appearing after a client fetch. Those crawls can take up to
// ~15-20s on a cold cache, and awaiting them here meant the ENTIRE page — the
// donation form included — did not render at all until both finished. Same
// bug as the one just found on /RoshHashanah, same fix: both go back to being
// fetched client-side, so this page is never blocked on USAePay to render.
export default function Page() {
  return <MerchantFundingPage />;
}
