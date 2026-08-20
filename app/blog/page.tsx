import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

const post = {
  title: "Bringing Light to Every Home: The Mission of Tomchei Shabbos Florida",
  date: "June 3, 2026",
  readTime: "3 min read",
  body: [
    "Every week, families across Florida look forward to the warmth and joy of Shabbos. For many, however, putting a complete Shabbos meal on the table can be a financial challenge. That's where Tomchei Shabbos Florida makes a meaningful difference.",
    "Tomchei Shabbos Florida is dedicated to helping individuals and families in need celebrate Shabbos with dignity. Through the generosity of donors, volunteers, and community partners, the organization provides food and essential items to those facing financial hardship, ensuring that no family has to choose between basic necessities and honoring Shabbos.",
    "Beyond the food itself, Tomchei Shabbos Florida strengthens the community by bringing people together through acts of kindness and compassion. Every donation, volunteer hour, and act of support helps create a stronger, more caring community where families know they are not alone.",
    "By supporting Tomchei Shabbos Florida, we help preserve the beauty of Shabbos and uphold the values of chesed, dignity, and community that are at the heart of Jewish life. Together, we can ensure that every family has the opportunity to experience the peace and joy of Shabbos.",
  ],
};

export default function BlogPage() {
  return (
    <main className="pt-20">

      {/* Hero */}
      <section className="relative min-h-[300px] flex items-center justify-center text-center overflow-hidden">
        <Image
          src="/blog-header.jpg"
          alt="Tomchei Shabbos community"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#1AABAB]/25" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white my-4 leading-[1.08]">News &amp; Stories</h1>
        </div>
      </section>

      {/* Article */}
      <section className="relative py-20 overflow-hidden" style={{ background: "linear-gradient(135deg, #1AABAB 0%, #0D8585 55%, #F5A020 130%)" }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "radial-gradient(circle, #ffffff 2px, transparent 2px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Article header */}
            <div className="bg-[#1AABAB] px-8 py-10">
              <div className="flex items-center gap-4 text-white/90 text-xs mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
              </div>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-snug">
                {post.title}
              </h2>
            </div>

            {/* Article body */}
            <div className="px-8 py-10 space-y-6">
              {post.body.map((paragraph, i) => (
                <p key={i} className="font-josefin text-gray-600 leading-relaxed text-[17px]">
                  {paragraph}
                </p>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/donate#payment"
                  className="bg-[#F5A020] text-white px-8 py-3 font-bold text-sm hover:bg-[#D48810] transition text-center">
                  Donate Now
                </Link>
                <Link href="/volunteer#ways"
                  className="border-2 border-[#1AABAB] text-[#1AABAB] px-8 py-3 font-bold text-sm hover:bg-[#1AABAB] hover:text-white transition text-center">
                  Volunteer With Us
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 text-sm hover:text-[#1AABAB] transition font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}

