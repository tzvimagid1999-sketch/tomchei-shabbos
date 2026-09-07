import MerchantFundingPage from "./MerchantFundingPage";
import { getMerchantFundingDonors } from "../lib/merchant-funding-donors";
import { getMerchantFundingTotal } from "../lib/merchant-funding-total";

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
  // Fetched here rather than left to the client, so the ticker, the supporter
  // list, and the Goal/Raised/Impact figures are already in the very first
  // HTML a visitor receives. Previously all of this only appeared once the
  // browser's own fetch resolved after the page had loaded — the donor names
  // could sit empty on a slow mobile connection until someone manually
  // refreshed, and the three stat boxes showed "Calculating..." for as long
  // as that fetch took.
  const [{ donors }, { total }] = await Promise.all([
    getMerchantFundingDonors(),
    getMerchantFundingTotal(),
  ]);
  return <MerchantFundingPage initialDonors={donors} initialRaised={total} />;
}
