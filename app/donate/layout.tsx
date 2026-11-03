// The page itself is a client component, so its metadata lives here. Without
// this, /donate showed the homepage's title and description in search results.
export const metadata = {
  alternates: { canonical: "/donate" },
  title: "Donate | Tomchei Shabbos of Florida",
  description:
    "Donate online to Tomchei Shabbos of Florida, one time or monthly. Your tax-deductible gift provides Shabbos food packages to local families in need. 501(c)(3).",
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
