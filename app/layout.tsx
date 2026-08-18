import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PopupBanner from "./components/PopupBanner";

// One display serif (headlines/quotes) + one UI sans (everything else).
// All the old font variable names below are kept and mapped onto these two
// in globals.css, so existing className="font-caveat" etc. usages don't
// need to be touched across the site.
const lora   = Lora({ subsets: ["latin"], variable: "--font-lora", style: ["normal", "italic"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Tomchei Shabbos Florida – Helping Every Family Celebrate Shabbos",
  description:
    "Tomchei Shabbos Florida provides food packages to families in need so everyone can have a beautiful Shabbos. Donate or volunteer today!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${lora.variable} ${dmSans.variable} font-sans`}>
        <Navbar />
        <PopupBanner />
        {children}
        <Footer />
      </body>
    </html>
  );
}
