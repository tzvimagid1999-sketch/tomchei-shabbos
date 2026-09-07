import RoshHashanahPage from "./RoshHashanahPage";
import { getMainDonationTotal } from "../lib/main-donation-total";

// Always re-render on request: the donation total is live data, not something
// to bake into the build.
export const dynamic = "force-dynamic";

export default async function Page() {
  // Fetched here rather than left entirely to the client, so the goal/raised/
  // percent figures are already in the very first HTML a visitor receives.
  // Previously they only appeared once the browser's own fetch resolved after
  // the page had loaded, showing "Calculating..." for as long as that took.
  // Cheap to call even when the bar is switched off — it is cache-backed, and
  // the client component itself decides whether to render the section at all.
  const { total } = await getMainDonationTotal();
  return <RoshHashanahPage initialTotal={total} />;
}
