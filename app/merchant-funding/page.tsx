import MerchantFundingPage from "./MerchantFundingPage";

export const metadata = {
  title: "Merchant Funding Community Campaign | Tomchei Shabbos of Florida",
  description:
    "The merchant funding community is raising $50,000 for Tomchei Shabbos of Florida, which delivers food to local families every week.",
  // Unlisted: reachable only by direct link, never through the site or search.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MerchantFundingPage />;
}
