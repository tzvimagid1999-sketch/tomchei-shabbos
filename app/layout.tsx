import type { Metadata } from "next";
import { Nunito, Playfair_Display, Caveat, Manrope, Josefin_Sans, Figtree, Jost, PT_Serif, Lora, DM_Sans, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PopupBanner from "./components/PopupBanner";

// Merchant funding campaign page only: Lora headings over DM Sans, with Frank
// Ruhl Libre for the Hebrew greeting — no other face loaded here has Hebrew
// glyphs, so without it the greeting falls back to whatever the browser has.
const lora     = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });
const dmSans   = DM_Sans({ subsets: ["latin"], variable: "--font-dm", weight: ["400", "500", "700"] });
const frankRuhl = Frank_Ruhl_Libre({ subsets: ["hebrew"], variable: "--font-hebrew-src", weight: ["500", "700"] });

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
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tomchei Shabbos Florida – Helping Every Family Celebrate Shabbos",
    description:
      "Tomchei Shabbos Florida provides food packages to families in need so everyone can have a beautiful Shabbos. Donate or volunteer today!",
    url: "https://tomcheishabbosflorida.org",
    siteName: "Tomchei Shabbos of Florida",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${nunito.variable} ${playfair.variable} ${caveat.variable} ${manrope.variable} ${josefin.variable} ${figtree.variable} ${jost.variable} ${ptSerif.variable} ${lora.variable} ${dmSans.variable} ${frankRuhl.variable} font-sans`}>
        <Navbar />
        <PopupBanner />
        {children}
        <Footer />
      </body>
    </html>
  );
}
