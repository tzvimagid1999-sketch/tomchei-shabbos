import MerchantFundingPage from "./MerchantFundingPage";
import { getMerchantFundingDonors } from "../lib/merchant-funding-donors";

export const metadata = {
  title: "Merchant Funding Community Campaign | Tomchei Shabbos of Florida",
  description:
    "The merchant funding community is raising $50,000 for Tomchei Shabbos of Florida, which delivers food to local families every week.",
  // Unlisted: reachable only by direct link, never through the site or search.
  robots: { index: false, follow: false },
};

// Always re-render on request: the donor list is live data, not something to
// bake into the build.
export const dynamic = "force-dynamic";

export default async function Page() {
  // Fetched here rather than left to the client, so the ticker and the
  // supporter list are already in the very first HTML a visitor receives.
  // Previously they only appeared once the browser's own fetch resolved after
  // the page had loaded — a gap that was most visible on a slow mobile
  // connection, where the page could sit with no names at all until someone
  // manually refreshed.
  const { donors } = await getMerchantFundingDonors();
  return <MerchantFundingPage initialDonors={donors} />;
}
