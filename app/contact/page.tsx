import Image from "next/image";
import Link from "next/link";
import { DONATE_HREF } from "../lib/site-config";
import { CONTACT_EMAIL, MAILING } from "../lib/contact-info";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us | Tomchei Shabbos of Florida",
  description:
    "Get in touch with Tomchei Shabbos of Florida, or find our mailing address for donations sent by check.",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2D2D2D] mb-3">{children}</p>
  );
}

export default function ContactPage() {
  return (
    <main className="pt-20">

      {/* Hero — the fixed 300px height every other page uses. */}
      <section className="relative min-h-[300px] flex items-center justify-center text-center overflow-hidden">
        <Image
          src="/about-header.jpg"
          alt="Tomchei Shabbos volunteers"
          fill
          className="object-cover object-bottom"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0F9FAE]/25" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white my-4 leading-[1.08]">
            Contact Us
          </h1>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">

          <h2 className="font-playfair text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">
            General Inquiries
          </h2>
          <div className="h-1 w-16 bg-[#C8A75B] mt-5 mb-14" />

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-12 lg:gap-16">

            {/* Details column. No phone number — the org does not want one posted. */}
            <div>
              <Label>Email</Label>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[17px] text-[#0a6e78] underline decoration-[#0a6e78]/30 underline-offset-4 hover:decoration-[#0a6e78] break-all"
              >
                {CONTACT_EMAIL}
              </a>

              {/* The reason this page exists: a donor could not find anywhere to
                  mail a check, because the address only appeared inside receipts
                  sent after donating. */}
              <div className="mt-10">
                <Label>Mailing Address</Label>
                <address className="not-italic text-[17px] text-[#2D2D2D] leading-relaxed">
                  {MAILING.payableTo}<br />
                  {MAILING.street}<br />
                  {MAILING.cityStateZip}
                </address>
              </div>
            </div>

            {/* Message column */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2D2D2D] mb-8">
                Send Us a Message
              </p>
              <ContactForm />
            </div>

          </div>
        </div>
      </section>

      {/* Most people arriving here want one of these three things, and can get
          them in a click instead of writing in and waiting for a reply. */}
      <section className="bg-[#F8F4EC] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { href: "/apply-for-assistance", title: "Apply for assistance", copy: "Weekly food packages, completely confidential." },
              { href: "/volunteer", title: "Volunteer with us", copy: "Help pack or deliver to families near you." },
              { href: DONATE_HREF, title: "Donate online", copy: "Give by card, one time or monthly." },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group bg-white rounded-2xl border border-[#E5E5E5] p-7 hover:border-[#C8A75B] transition-colors"
              >
                <span className="block font-playfair text-xl font-bold text-[#2D2D2D] mb-2 group-hover:text-[#8B6F3A] transition-colors">
                  {l.title}
                </span>
                <span className="block text-[15px] text-gray-600 leading-relaxed">{l.copy}</span>
                <span aria-hidden="true" className="inline-block text-[#C8A75B] text-xl mt-4 transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-12">
            Tomchei Shabbos of Florida is a 501(c)(3) tax-exempt organization &middot; Tax ID: 83-2155012
          </p>
        </div>
      </section>
    </main>
  );
}
