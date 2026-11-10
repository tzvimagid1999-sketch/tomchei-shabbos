import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { DONATE_HREF } from "../lib/site-config";

export const metadata = {
  alternates: { canonical: "/blog" },
  title: "News & Stories | Tomchei Shabbos of Florida",
  description:
    "The Tomchei Shabbos of Florida newsletter: family stories, volunteer spotlights and the impact of your support.",
};

const post = {
  title: "Newsletter: September–October 2026",
  date: "Parshas Chayei Sarah · Nov. 6, 2026",
  readTime: "6 min read",
};

const stats = [
  { month: "September", families: "450+", people: "2,250+", pounds: "54,970+" },
  { month: "October", families: "450+", people: "2,250+", pounds: "43,124+" },
];

const testimonials = [
  "Dear everyone at Tomchei Shabbos, I am just standing here in tears from happiness. I just cannot get over. God bless you and the organization for everything you do. You really made a holiday much better and much easier for the things that we really couldn’t afford and I thank you from the bottom of my heart.",
  "You thought of absolutely everything, down to the smallest details: the plasticware, cake, honey, apples, pomegranate, vegetables, beautiful challahs, and such an incredible amount of meat. Everything was prepared with so much care and thoughtfulness. We truly feel the abundance, love, and kindness behind every single item.",
];

const driverQA = [
  ["What’s your name, and which area do you deliver in?", "Alexander Mantofel. Normandy Shores, Miami Beach."],
  ["How long have you been volunteering with Tomchei Shabbos?", "Seven years."],
  ["How did you first get involved?", "Through a friend."],
  ["Describe your delivery experience in one word.", "Beautiful."],
  ["What’s your favorite part of being a driver?", "Every time, it makes me smile."],
  ["How do you feel after finishing your deliveries?", "I feel like I did what Hashem wanted me to do!"],
  ["What would you tell someone thinking about volunteering?", "I would tell them it’s one of the best things I do. I’ve encouraged others to volunteer and told them the same thing."],
  ["Finish this sentence: “I drive for Tomchei Shabbos because…”", "Tomchei Shabbos really makes a difference. I see it myself."],
];

const packerQA = [
  ["How long have you been packing?", "I’ve been packing for a few months."],
  ["How did you first get involved with Tomchei Shabbos?", "My high school daughter was packing for her school chesed hours, and I decided to join her. I enjoyed it so much that I wanted to continue as a family activity. My husband and other children got involved too, and we all love helping out."],
  ["What’s your favorite part of packing?", "I love knowing that I’m helping families in need and that they’re receiving top-quality food, produce and paper goods."],
  ["Describe the atmosphere at packing in one word.", "It’s hard to pick just one, but I would say “purposeful.” Everyone is there for a meaningful reason."],
  ["What keeps you coming back?", "It’s so rewarding to see volunteers of all ages and backgrounds working side by side, giving their time and effort to help others. It really shows the power of community and what we can accomplish when we come together."],
  ["How do you feel knowing these boxes will be on families’ Shabbos tables?", "I imagine a family sitting around a Shabbos table without having to worry about how to pay for it all. It’s heartwarming and a beautiful feeling."],
  ["What would you tell someone thinking about volunteering?", "Come and experience it for yourself! You don’t realize how rewarding it is until you’re there packing boxes. You meet wonderful people and leave feeling like you’ve really made a difference in a family’s life."],
  ["What items go in a box?", "The boxes include foods for Shabbos, from grape juice and chicken to vegetables and challah. For Yom Tov, families also receive meat, paper goods and other holiday-related items."],
];

const body = "font-josefin text-gray-600 leading-relaxed text-[17px]";
const h3 = "font-playfair text-2xl font-bold text-gray-900";

function QA({ items }: { items: string[][] }) {
  return (
    <div className="space-y-5">
      {items.map(([q, a]) => (
        <div key={q}>
          <p className="font-josefin font-bold text-[#1AABAB] text-[16px]">{q}</p>
          <p className={body}>{a}</p>
        </div>
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <main className="pt-20">

      {/* Hero */}
      <section className="relative min-h-[300px] flex items-center justify-center text-center overflow-hidden">
        <Image
          src="/blog-header.jpg"
          alt="Tomchei Shabbos community"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#1AABAB]/25" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white my-4 leading-[1.08]">News &amp; Stories</h1>
        </div>
      </section>

      {/* Article */}
      <section className="bg-[#FDF9F7] py-20">
        <div className="max-w-3xl mx-auto px-6">

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
              <p className="text-white/90 text-sm mt-3">Our Community &middot; Our Impact &mdash; Nourishment. Dignity. A community that cares.</p>
            </div>

            {/* Article body */}
            <div className="px-8 py-10 space-y-6">

              <h3 className={h3}>Words of Inspiration</h3>
              <div className="flex items-center gap-4">
                <Image src="/blog/rabbi-grossberg.jpg" alt="Rabbi Menachem Grossberg" width={80} height={80}
                  className="rounded-full object-cover w-20 h-20" />
                <p className="font-josefin text-gray-500 text-sm leading-snug">
                  <strong className="text-gray-800">Rabbi Menachem Grossberg</strong><br />
                  Development and Fundraising at Tomchei Shabbos of Florida
                </p>
              </div>
              <p className={body}>Over the past few weeks, we have been learning about Avraham Avinu. As we all know, Avraham’s defining middah is Chesed. In last week’s parsha, Parshas Vayeira, we learned that Avraham was distraught when he was unable to host guests, so Hashem sent three malachim to be his “guests.”</p>
              <p className={body}>The question is obvious: What is there to be distraught about when there are no guests to be found? Should we be sad that we can’t keep the laws of Shabbos on a Tuesday? It’s not Shabbos! If there was simply no one to host, why the sadness?</p>
              <p className={body}>Rav Moshe Feinstein answers with a powerful idea. The mitzvah of Chesed includes not only performing acts of kindness when the need arises, but also anticipating and longing for opportunities to do so. We have a mitzvah to seek out Chesed. That was the source of Avraham Avinu’s anguish: he was fulfilling the mitzvah of seeking out and longing for Chesed!</p>
              <p className={body}>Let us take this message to heart. Let us not only do Chesed when the opportunity comes to us, but also follow Avraham Avinu’s example and actively seek out opportunities to help others.</p>
              <p className={body}>Tomchei Shabbos is proud to present our inaugural monthly email newsletter. Each month, we’ll look back at the Chesed accomplished during the previous month and look ahead to the opportunities for Chesed our community still needs. Have a good Shabbos!</p>

              <h3 className={`${h3} pt-4`}>A community of kindness</h3>
              <p className={body}><strong>Every box carries your care.</strong></p>
              <p className={body}>Every week, a community comes together so another family can welcome Shabbos with a full table and peace of mind. From our donors to our packers and drivers, each person plays a part. As we look back at the last couple of months, we’re grateful to share what your kindness has made possible.</p>

              <h3 className={`${h3} pt-4`}>Impact with numbers</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div key={s.month} className="rounded-xl bg-[#FAF3E8] p-6">
                    <p className="text-[#F5A020] font-bold text-xs uppercase tracking-widest mb-3">{s.month}</p>
                    <p className="font-playfair text-2xl font-bold text-[#1AABAB]">{s.families} <span className="text-sm font-josefin font-normal text-gray-600">families served</span></p>
                    <p className="font-playfair text-2xl font-bold text-[#1AABAB]">{s.people} <span className="text-sm font-josefin font-normal text-gray-600">individuals</span></p>
                    <p className="font-playfair text-2xl font-bold text-[#1AABAB]">{s.pounds} <span className="text-sm font-josefin font-normal text-gray-600">pounds of food</span></p>
                  </div>
                ))}
              </div>
              <p className={body}>With more than 100 volunteer drivers, we bring deliveries to families across Miami Beach, Surfside, Normandy, North Miami Beach, Hollywood, Fort Lauderdale, Aventura, Hallandale, Lauderhill, Boynton Beach, Boca Raton, Delray Beach, Deerfield Beach, Parkland and Coral Springs. Behind every delivery is a family welcoming Shabbos and Yom Tov with more peace, tranquility, joy and nourishment.</p>

              <h3 className={`${h3} pt-4`}>Customized boxes</h3>
              <p className={body}>This summer, we launched a customized ordering pilot for families in Palm Beach County. Through a website built by our board member, Avrohom Liberman, families select groceries within a weekly budget based on family size. Volunteers then pack their individual orders.</p>
              <p className={body}>Families are loving the ability to choose food that suits their households. It means more of what they need, more of what their children enjoy, and less waste. During the first 11 weeks, 977 orders were placed and 19,912 items packed and delivered. As we refine the program, we look forward to expanding it to more communities.</p>

              <h3 className={`${h3} pt-4`}>Family Testimonials</h3>
              <p className={body}>One family emailed us the following:</p>
              {testimonials.map((t, i) => (
                <blockquote key={i} className="border-l-4 border-[#F5A020] pl-5 font-josefin italic text-gray-600 leading-relaxed text-[17px]">
                  “{t}”
                </blockquote>
              ))}
              <p className={body}>After Rosh Hashanah, one family wrote:</p>
              <p className={body}>To everyone who gives their time, resources and heart: families feel your care in every delivery.</p>

              <h3 className={`${h3} pt-4`}>Behind the Scenes</h3>
              <p className={body}>At our warehouse, preparations begin long before deliveries head out. As pallets of food arrive, Daniel, our Director of Operations, makes sure everything is organized and ready to pack. Packing starts Wednesday morning. That evening, over 100 boxes travel to Boca Raton on a refrigerated truck. The next day, packing begins again for families in Broward and Miami-Dade counties.</p>
              <p className={body}>Every week brings another round of organizing, packing and delivering—and another opportunity to care for our neighbors.</p>
              <Image src="/blog/couples-packing-night.jpg" alt="Couples Packing Night Out at Tomchei Shabbos of Florida"
                width={1199} height={1312} className="rounded-xl w-full max-w-md mx-auto h-auto" />

              <h3 className={`${h3} pt-4`}>Volunteer Spotlight</h3>
              <p className={body}><strong>Q&amp;A with a Volunteer Packer and Driver</strong></p>
              <QA items={driverQA} />

              <h3 className={`${h3} pt-4`}>A packer’s perspective</h3>
              <p className={body}><strong>Making chesed a family tradition.</strong></p>
              <p className={body}>One of our packers, who wishes to remain anonymous, shares how joining her daughter for chesed hours became something her whole family loves.</p>
              <QA items={packerQA} />

              <h3 className={`${h3} pt-4`}>With appreciation: A community that shows up</h3>
              <p className={body}>We’re grateful to the schools, organizations and corporations who joined our packing efforts: Klurman Lubavitch Yeshiva, Yeshivas Toras Chaim Toras Emes, Bnos Bais Yaakov, Diesel Funding, Toras Chaim Yeshiva, Zucker Aventura, Mommy &amp; Me Mitzvah Club, Yehudi, Bais Yaakov Miami, Hillel Aventura, Rohr Middle School, Ohr Hatorah and Kesher.</p>
              <p className={body}>We also enjoyed participating in Landow Jewish Academy Chesed Expo, where students learned about local organizations and opportunities to volunteer. It was a pleasure to see school leadership encouraging the next generation to get involved in chesed.</p>
              <Image src="/blog/volunteers-thank-you.jpg" alt="Thank you to our Tomchei Shabbos volunteers"
                width={1536} height={1024} className="rounded-xl w-full h-auto" />

              <h3 className={`${h3} pt-4`}>Keep the kindness going: Help fill next week’s boxes</h3>
              <p className={body}>The chagim have passed, but the need continues every week. Providing food for 400+ families across South Florida is a significant ongoing expense. Your generosity helps keep this vital work going, bringing nourishing meals and peace of mind to families every Shabbos.</p>
              <p className={body}>Consider making your gift monthly to help keep families’ tables full throughout the year.</p>
              <p className={body}><strong>With heartfelt appreciation</strong><br />Thank you for being part of our family. May the kindness you share bring bracha to you and your loved ones.<br /><strong>The Tomchei Shabbos of Florida Team</strong></p>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col sm:flex-row gap-4">
                <Link href={DONATE_HREF}
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
