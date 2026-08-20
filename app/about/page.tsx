import Link from "next/link";
import Image from "next/image";
import { DONATE_HREF } from "../lib/site-config";

export default function AboutPage() {
  return (
    <main className="pt-20">

      {/* Hero */}
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
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white my-4 leading-[1.08]">About Tomchei Shabbos Florida</h1>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">Our Mission</span>
              <h2
                className="font-playfair font-semibold text-gray-900 mt-3 mb-12"
                style={{ fontSize: "58px", lineHeight: "1.05", letterSpacing: "-0.03em" }}
              >
                Every Family Deserves<br />a Beautiful Shabbos
              </h2>
              <p className="font-manrope text-[#495057] mb-6" style={{ fontSize: "19px", lineHeight: "1.75", maxWidth: "600px" }}>
                Tomchei Shabbos Florida was founded on a simple but powerful idea: every Jewish family
                deserves the dignity of a beautiful Shabbos, regardless of their financial situation.
              </p>
              <p className="font-manrope text-[#495057] mb-12" style={{ fontSize: "19px", lineHeight: "1.75", maxWidth: "600px" }}>
                Each week, our dedicated volunteers shop, pack, and deliver full Shabbos food packages
                to families across Florida so that Kiddush can be made and Shabbos can be celebrated with joy.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {([
                  { value: "350+", label: "Families Served" },
                  { value: "52",   label: "Weeks / Year" },
                  { value: "100%", label: "To Families" },
                ] as { value: string; label: string }[]).map(({ value, label }) => (
                  <div
                    key={label}
                    className="text-center p-3 sm:p-5"
                    style={{
                      background: "#FFF8F4",
                      border: "1px solid #F3E7DE",
                      borderRadius: "18px",
                      boxShadow: "0 10px 30px rgba(0,0,0,.04)",
                    }}
                  >
                    <div
                      className="font-pt-serif text-[#F5A020] text-3xl sm:text-5xl"
                      style={{ fontWeight: 700, lineHeight: 1.1 }}
                    >
                      {value}
                    </div>
                    <div
                      className="text-gray-500 mt-1 uppercase text-[11px] sm:text-[15px]"
                      style={{ fontWeight: 500, letterSpacing: "0.04em" }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-xl h-[520px] relative">
              <Image src="/photos/photo-2.jpg" alt="Tomchei Shabbos volunteers packing food" fill className="object-cover" style={{ objectPosition: "50% 25%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#FDF9F7] pt-24 pb-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center font-playfair italic text-2xl sm:text-3xl text-[#0F9FAE] mb-16 leading-relaxed">
            &ldquo;Every family deserves to experience Shabbos with dignity.&rdquo;
          </p>
          <div className="grid lg:grid-cols-2 gap-16 items-stretch">
            <div className="flex flex-col gap-7 lg:h-full">
              <div className="rounded-2xl overflow-hidden h-96 relative shadow-lg shrink-0">
                <Image src="/photos/photo-10.jpg" alt="Tomchei Shabbos volunteers" fill className="object-cover" />
              </div>
            </div>
            <div>
              <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">Our Story</span>
              <h2 className="font-playfair font-semibold text-gray-900 mt-3 mb-10 leading-tight" style={{ fontSize: "42px", letterSpacing: "-0.02em" }}>
                How It All Began
              </h2>
              <p className="font-manrope text-[#495057] mb-5" style={{ fontSize: "18px", lineHeight: "1.75", maxWidth: "600px" }}>
                Tomchei Shabbos of Florida was born in a small family home, where a small circle of
                devoted volunteers gathered each week to prepare and distribute Shabbos food packages
                to families quietly struggling to make ends meet.
              </p>
              <p className="font-manrope text-[#495057] mb-5" style={{ fontSize: "18px", lineHeight: "1.75", maxWidth: "600px" }}>
                What started as a handful of packages delivered by a few caring neighbors has grown
                into one of South Florida&apos;s most trusted Jewish charitable organizations.
                Week after week, rain or shine, our volunteers show up because they know that
                somewhere in our community, a family is counting on them.
              </p>
              <p className="font-manrope text-[#495057]" style={{ fontSize: "18px", lineHeight: "1.75", maxWidth: "600px" }}>
                Today, Tomchei Shabbos of Florida serves hundreds of families across the region,
                providing not just food, but dignity, hope, and the warmth of a community that cares.
                <span className="italic text-[#0F9FAE]"> Our neighbors. Our friends. Our community.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="bg-white py-24 overflow-hidden">
        <div className="text-center mb-10 px-6">
          <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">Gallery</span>
          <h2 className="font-playfair text-5xl sm:text-6xl font-semibold text-[#0F9FAE] mt-2 leading-[1.1]">Our Community in Action</h2>
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex gap-4 animate-marquee whitespace-nowrap">
            {[
              "/photos/boy-cutting-onions.jpg",
              "/photos/photo-2.jpg",
              "/photos/photo-10.jpg",
              "/photos/photo-11.jpg",
              "/photos/photo-1.jpg",
              "/photos/photo-4.jpg",
              "/photos/photo-6.jpg",
              "/photos/boy-cutting-onions.jpg",
              "/photos/photo-2.jpg",
              "/photos/photo-10.jpg",
              "/photos/photo-11.jpg",
              "/photos/photo-1.jpg",
              "/photos/photo-4.jpg",
              "/photos/photo-6.jpg",
            ].map((src, i) => (
              <div key={i} className="relative h-64 w-80 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                <Image src={src} alt="Tomchei Shabbos community" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-[#0F9FAE] py-24 text-center overflow-hidden">
        <div className="relative z-10 max-w-xl mx-auto px-6">
          <h2 className="font-playfair text-5xl sm:text-6xl font-bold text-white mb-4 leading-[1.1]">Join Our Mission</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={DONATE_HREF}
              className="bg-[#F5A020] text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-[#D48810] transition">
              Donate Now
            </Link>
            <Link href="/volunteer"
              className="border border-white/40 text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-white/10 transition">
              Volunteer
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
