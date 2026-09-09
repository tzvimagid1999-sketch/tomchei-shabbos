import RoshHashanahPage from "./RoshHashanahPage";

// REVERTED 2026-09-09: this page used to await getMainDonationTotal() here so
// the figure was already in the first HTML instead of showing
// "Calculating...". That fetch is a paged USAePay crawl that can take up to
// ~15s on a cold cache, and awaiting it here meant the ENTIRE page — donate
// button included — did not render at all until it finished. That is a far
// worse trade than a brief "Calculating..." on the number: it can block a
// donor from reaching the payment form entirely. The total goes back to being
// fetched client-side, same as before that change, so navigating here is
// instant regardless of the cache state.
export default function Page() {
  return <RoshHashanahPage initialTotal={null} />;
}
