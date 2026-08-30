import Image from "next/image";
import Link from "next/link";
import { DONATE_HREF } from "../lib/site-config";

// Contact details in one place so the mailing address can also be reused
// elsewhere (footer, a "mail a check" giving option) without being retyped.
//
// TODO: CONTACT_EMAIL is a placeholder — the org has not yet chosen which
// inbox should receive general enquiries. Do NOT deploy this page until it is
// replaced with a real, monitored address.
const CONTACT_EMAIL = "REPLACE-ME@tomcheishabbosflorida.org";

const MAILING = {
  payableTo: "Tomchei Shabbos of Florida",
  street: "194 NE 186th Terrace",
  cityStateZip: "North Miami Beach, FL 33179",
};

export const metadata = {
  title: "Contact Us | Tomchei Shabbos of Florida",
  description:
    "Get in touch with Tomchei Shabbos of Florida, or find our mailing address for donations sent by check.",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8A75B] mb-2">
      {children}
    </p>
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
        <div className="max-w-5xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">
              We&rsquo;re here
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl font-semibold text-gray-900 mt-2 mb-5 leading-tight">
              Get in touch
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Whether you have a question about donating, want to volunteer, or need help —
              we read every message and we answer.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Reach us */}
            <div className="rounded-2xl border border-[#E5E5E5] p-8 sm:p-9">
              <h3 className="font-playfair text-2xl font-bold text-[#2D2D2D] mb-7">
                General inquiries
              </h3>

              <Label>Email</Label>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[17px] font-semibold text-[#0a6e78] underline decoration-[#0a6e78]/30 underline-offset-4 hover:decoration-[#0a6e78] break-all"
              >
                {CONTACT_EMAIL}
              </a>

              <div className="h-px bg-[#E5E5E5] my-7" />

              {/* The reason this page exists: a donor could not find anywhere to
                  mail a check, because the address only appeared inside receipts
                  sent after donating. */}
              <Label>Mailing address</Label>
              <address className="not-italic text-[17px] text-[#2D2D2D] leading-relaxed">
                {MAILING.payableTo}<br />
                {MAILING.street}<br />
                {MAILING.cityStateZip}
              </address>
              <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">
                Sending a check? Make it payable to{" "}
                <span className="font-semibold text-[#2D2D2D]">{MAILING.payableTo}</span>.
              </p>
            </div>

            {/* Straight to what most people came for, so they don't have to
                email and wait for an answer they could get in one click. */}
            <div className="rounded-2xl bg-[#F8F4EC] p-8 sm:p-9">
              <h3 className="font-playfair text-2xl font-bold text-[#2D2D2D] mb-7">
                Looking for something specific?
              </h3>

              <div className="flex flex-col divide-y divide-[#E0D6C2]">
                {[
                  { href: "/apply-for-assistance", title: "I need assistance", copy: "Apply for weekly food packages. Completely confidential." },
                  { href: "/volunteer", title: "I want to volunteer", copy: "Help pack or deliver to families across South Florida." },
                  { href: DONATE_HREF, title: "I want to donate", copy: "Give online by card, one time or monthly." },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group flex items-start gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <span className="flex-1">
                      <span className="block font-bold text-[17px] text-[#2D2D2D] group-hover:text-[#8B6F3A] transition-colors">
                        {l.title}
                      </span>
                      <span className="block text-[15px] text-gray-600 mt-1 leading-relaxed">
                        {l.copy}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-[#C8A75B] text-xl mt-0.5 transition-transform group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          <p className="text-center text-sm text-gray-500 mt-12">
            Tomchei Shabbos of Florida is a 501(c)(3) tax-exempt organization &middot; Tax ID: 83-2155012
          </p>

        </div>
      </section>
    </main>
  );
}
