import type { Metadata } from "next";
import { Nunito, Playfair_Display, Caveat, Manrope, Josefin_Sans, Figtree, Jost, PT_Serif, Lora, DM_Sans, Frank_Ruhl_Libre, Anton, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Merchant funding campaign page only: Lora headings over DM Sans, with Frank
// Ruhl Libre for the Hebrew greeting — no other face loaded here has Hebrew
// glyphs, so without it the greeting falls back to whatever the browser has.
const lora     = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });
const dmSans   = DM_Sans({ subsets: ["latin"], variable: "--font-dm", weight: ["400", "500", "700"] });
const frankRuhl = Frank_Ruhl_Libre({ subsets: ["hebrew"], variable: "--font-hebrew-src", weight: ["500", "700"] });
// The campaign hero headline, matching the lettering on the Out For Delivery
// artwork. Anton ships a single weight, so nothing may ask it for bold — the
// browser would synthesise one and distort the glyphs.
const anton    = Anton({ subsets: ["latin"], variable: "--font-anton", weight: ["400"] });
// The campaign hero headline: a warm editorial serif, chosen over DM Serif
// Display and Cormorant Garamond, which read colder and thinner at hero size.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["500", "600", "700"] });

const nunito   = Nunito({ subsets: ["latin"], variable: "--font-nunito",   weight: ["400", "500", "600", "700", "800", "900"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", style: ["normal", "italic"] });
const caveat   = Caveat({ subsets: ["latin"], variable: "--font-caveat",   weight: ["400", "600", "700"] });
const manrope  = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700"] });
const josefin  = Josefin_Sans({ subsets: ["latin"], variable: "--font-josefin", weight: ["400", "500", "600", "700"] });
const figtree  = Figtree({ subsets: ["latin"], variable: "--font-figtree", weight: ["400", "500", "600", "700", "800"] });
const jost     = Jost({ subsets: ["latin"], variable: "--font-jost", weight: ["400", "500", "600", "700", "800"] });
const ptSerif  = PT_Serif({ subsets: ["latin"], variable: "--font-pt-serif", weight: ["400", "700"] });

export const metadata: Metadata = {
  // metadataBase lets Google and social platforms resolve relative URLs.
  metadataBase: new URL("https://tomcheishabbosflorida.org"),
  title: "Tomchei Shabbos Florida – Helping Every Family Celebrate Shabbos",
  description:
    "Tomchei Shabbos Florida provides food packages to families in need so everyone can have a beautiful Shabbos. Donate or volunteer today!",
  // No site-wide canonical here: a canonical set on the layout is inherited by
  // every page, which told Google each page was a copy of the homepage. Each
  // page sets its own.
  openGraph: {
    title: "Tomchei Shabbos Florida – Helping Every Family Celebrate Shabbos",
    description:
      "Tomchei Shabbos Florida provides food packages to families in need so everyone can have a beautiful Shabbos. Donate or volunteer today!",
    url: "https://tomcheishabbosflorida.org",
    siteName: "Tomchei Shabbos of Florida",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tomchei Shabbos volunteers packing food for families" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomchei Shabbos Florida – Helping Every Family Celebrate Shabbos",
    description:
      "Tomchei Shabbos Florida provides food packages to families in need so everyone can have a beautiful Shabbos.",
    images: ["/og-image.jpg"],
  },
};

// Tells Google who the organization is (name, logo, address, nonprofit status),
// which feeds the knowledge panel and rich results.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NonprofitOrganization",
  name: "Tomchei Shabbos of Florida",
  url: "https://tomcheishabbosflorida.org",
  logo: "https://tomcheishabbosflorida.org/logo-transparent.png",
  image: "https://tomcheishabbosflorida.org/og-image.jpg",
  description:
    "Tomchei Shabbos of Florida provides weekly Shabbos and Yom Tov food packages to families in need across South Florida, with dignity and discretion.",
  email: "info@tomcheishabbosflorida.org",
  taxID: "83-2155012",
  nonprofitStatus: "Nonprofit501c3",
  areaServed: "South Florida",
  address: {
    "@type": "PostalAddress",
    streetAddress: "194 NE 186th Terrace",
    addressLocality: "North Miami Beach",
    addressRegion: "FL",
    postalCode: "33179",
    addressCountry: "US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${nunito.variable} ${playfair.variable} ${caveat.variable} ${manrope.variable} ${josefin.variable} ${figtree.variable} ${jost.variable} ${ptSerif.variable} ${lora.variable} ${dmSans.variable} ${frankRuhl.variable} ${anton.variable} ${fraunces.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
