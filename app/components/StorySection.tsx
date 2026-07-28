import Image from "next/image";

export default function StorySection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">

        {/* Tagline */}
        <p className="text-center font-playfair italic text-2xl sm:text-3xl text-[#1AABAB] mb-16 leading-relaxed">
          &ldquo;Every family deserves to experience Shabbos with dignity.&rdquo;
        </p>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="rounded-2xl overflow-hidden h-96 relative shadow-lg">
            <Image src="/photos/photo-2.jpg" alt="Tomchei Shabbos volunteers" fill className="object-cover" />
          </div>

          <div>
            <span className="text-[#F5A020] font-semibold text-xs uppercase tracking-widest">Our Story</span>
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mt-3 mb-6 leading-tight">
              How It All Began
            </h2>
            <p className="font-playfair text-gray-600 text-lg leading-relaxed mb-5">
              Tomchei Shabbos of Florida was born in a small family home, where a small circle of
              devoted volunteers gathered each week to prepare and distribute Shabbos food packages
              to families quietly struggling to make ends meet.
            </p>
            <p className="font-playfair text-gray-600 text-lg leading-relaxed mb-5">
              What started as a handful of packages delivered by a few caring neighbors has grown
              into one of South Florida&apos;s most trusted Jewish charitable organizations.
              Week after week, rain or shine, our volunteers show up because they know that
              somewhere in our community, a family is counting on them.
            </p>
            <p className="font-playfair text-gray-600 text-lg leading-relaxed">
              Today, Tomchei Shabbos of Florida serves hundreds of families across the region,
              providing not just food, but dignity, hope, and the warmth of a community that cares.
              <span className="italic text-[#1AABAB]"> Our neighbors. Our friends. Our community.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

