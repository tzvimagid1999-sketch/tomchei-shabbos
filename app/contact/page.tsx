import Image from "next/image";
import Link from "next/link";
import { DONATE_HREF } from "../lib/site-config";

// Contact details in one place so the mailing address can also be reused
// elsewhere (footer, "mail a check" giving option) without being retyped.
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

export default function ContactPage() {
  return (
    <main className="pt-20">

      {/* Hero — matches the fixed 300px hero every other page uses. */}
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

      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">

          <p className="text-lg text-gray-600 leading-relaxed text-center mb-14">
            We&rsquo;d love to hear from you — whether you have a question about donating,
            want to volunteer, or need help.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">

            {/* Email */}
            <div className="rounded-2xl border border-[#E5E5E5] p-7">
              <h2 className="font-playfair text-2xl font-bold text-[#2D2D2D] mb-2">Email us</h2>
              <p className="text-gray-600 mb-4 text-[15px] leading-relaxed">
                The quickest way to reach us. We answer every message.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[#0a6e78] underline break-all hover:text-[#08555d]"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Mailing address — the reason this page exists. Donors making an
                IRA qualified charitable distribution can only send a paper
                check, so the address has to be findable without donating first. */}
            <div className="rounded-2xl border border-[#E5E5E5] p-7">
              <h2 className="font-playfair text-2xl font-bold text-[#2D2D2D] mb-2">Mail a check</h2>
              <p className="text-gray-600 mb-4 text-[15px] leading-relaxed">
                Make checks payable to <strong className="text-[#2D2D2D]">{MAILING.payableTo}</strong>.
              </p>
              <address className="not-italic text-[#2D2D2D] leading-relaxed font-semibold">
                {MAILING.payableTo}<br />
                {MAILING.street}<br />
                {MAILING.cityStateZip}
              </address>
            </div>

          </div>

          <div className="mt-14 text-center">
            <Link
              href={DONATE_HREF}
              className="inline-block bg-[#C8A75B] hover:bg-[#B8975B] text-white px-9 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Donate Online
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
