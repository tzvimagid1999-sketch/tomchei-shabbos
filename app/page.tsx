import Link from "next/link";
import Image from "next/image";
import StatsSection from "./components/StatsSection";
import FadeInOnScroll from "./components/FadeInOnScroll";

export default function Home() {
  return (
    <main className="pt-20">

      {/* Hero */}
      <section className="relative min-h-[65vh] sm:min-h-[90vh] flex flex-col overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D8585]/60 via-black/30 to-black/60" />

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-16 pb-8">
          <p className="font-jost text-white text-2xl sm:text-4xl font-light mb-1 drop-shadow-lg">
            Making Shabbos Possible for Families in
          </p>
          <h1 className="font-jost font-black text-[#F5A020] text-5xl sm:text-7xl lg:text-8xl leading-tight mb-4 drop-shadow-lg">
            Florida
          </h1>
          <p className="font-jost text-white text-xl sm:text-2xl font-bold tracking-wide drop-shadow-lg">
            Food. Dignity. Community.
          </p>
        </div>

        {/* Buttons — bottom-right */}
        <div className="relative z-10 flex flex-wrap justify-end gap-4 px-8 sm:px-16 pb-14">
          <Link href="/donate#payment"
            className="bg-[#F5A020] text-white px-10 py-5 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest hover:bg-[#D48810] transition-all duration-150 shadow-lg">
            Make a Donation
          </Link>
          <Link href="/volunteer"
            className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-10 py-5 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest hover:bg-white/30 transition-all duration-150 shadow-lg">
            Get Involved
          </Link>
        </div>
      </section>

      {/* Tagline strip */}
      <div className="bg-[#1AABAB] py-5 text-center">
        <p className="font-playfair italic text-white text-lg sm:text-xl tracking-wide">
          Making Shabbos possible for families throughout South Florida.
        </p>
      </div>

      {/* Animated stats */}
      <StatsSection />

      {/* Tagline */}
      <div className="bg-[#FAF3E8] paper-texture py-16 text-center px-6">
        <p className="font-playfair italic text-3xl sm:text-4xl text-[#7A5C3A] max-w-3xl mx-auto leading-relaxed">
          &ldquo;Your donation provides a family&apos;s Shabbos this week.&rdquo;
        </p>
        <Link href="/donate#payment"
          className="inline-block mt-8 bg-[#F5A020] text-white px-10 py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#D48810] transition">
          Donate Now
        </Link>
      </div>

      {/* How We Help */}
      <section className="bg-[#FEFCF7] paper-texture py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: heading + stacked cards */}
            <div>
              <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">Bringing Shabbos Home</h2>
              <p className="text-[#8B7355] text-lg mb-10">
                Every week, our volunteers make sure no family goes without a Shabbos meal.
              </p>
              <div className="flex flex-col gap-6">
                {([
                  { pre: "Every delivery is a reminder that someone cares. It's more than food; it's ", bold: "hope", post: "." },
                  { pre: "Tomchei Shabbos ensures our family can celebrate Shabbos with the ", bold: "dignity", post: " and joy it deserves." },
                  { pre: "The ", bold: "peace of mind", post: " knowing Shabbos is taken care of is truly a priceless gift." },
                ] as { pre: string; bold: string; post: string }[]).map(({ pre, bold, post }, i) => (
                  <FadeInOnScroll key={i} delay={i * 120}>
                    <div className="bg-[#FAF3E8] rounded-3xl p-8 border border-[#E8D9C0] hover:border-[#C17642]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <p className="font-playfair italic text-[#8B7355] text-lg leading-relaxed">
                        &ldquo;{pre}<strong className="font-bold text-[#C17642] not-italic uppercase tracking-wide">{bold}</strong>{post}&rdquo;
                      </p>
                    </div>
                  </FadeInOnScroll>
                ))}
              </div>
            </div>

            {/* Right: photo */}
            <div className="relative h-[580px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/photos/boys-filling-boxes.jpg"
                alt="Boys filling up Shabbos boxes"
                fill
                className="object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Tagline */}
      <div className="bg-[#FEFCF7] py-16 text-center px-6 border-t border-[#E8D9C0]">
        <p className="font-playfair italic text-3xl sm:text-4xl text-[#1AABAB] max-w-3xl mx-auto leading-relaxed">
          &ldquo;Our Neighbors. Our Friends. Our Community.&rdquo;
        </p>
      </div>

      {/* CTA banner */}
      <section className="relative bg-[#1AABAB] py-10 overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-playfair text-4xl font-bold text-white mt-6 mb-4">Make This Shabbos Special!</h2>
          <p className="text-white/90 mb-10 text-lg leading-relaxed font-playfair italic">
            Join our family of supporters helping Florida families celebrate Shabbos with dignity and joy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/donate#payment"
              className="bg-[#F5A020] text-white px-10 py-4 rounded-lg font-bold text-base tracking-wide hover:bg-[#D48810] transition-all duration-150">
              Donate Now
            </Link>
            <Link href="/about"
              className="border-2 border-white text-white px-10 py-4 rounded-lg font-semibold text-base hover:bg-white hover:text-[#1AABAB] transition-all duration-150">
              Learn More
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
