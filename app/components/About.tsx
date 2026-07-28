const cards = [
  { emoji: "🛒", title: "We Shop",    desc: "Our dedicated volunteers shop and prepare fresh, complete Shabbos food packages every week." },
  { emoji: "🚗", title: "We Deliver", desc: "Packages are delivered directly to families' doors before Shabbos — with love and care." },
  { emoji: "✨", title: "We Inspire", desc: "Every family we help gets to experience the joy and beauty of a full Shabbos celebration." },
];

const values = [
  "🤝 Community-driven and volunteer-powered",
  "🔒 100% of donations go directly to families",
  "⚡ Weekly deliveries, every single Shabbos",
  "❤️ We treat every family with dignity and respect",
  "🌟 Serving all Jewish families in need",
  "📞 Confidential and caring support",
];

export default function About() {
  return (
    <section id="about" className="bg-blue-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-yellow-600 font-bold text-sm uppercase tracking-widest">Our Mission</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 mt-3 mb-4">
            What We Do 💙
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Tomchei Shabbos Florida was founded on one simple idea: <strong>no family should go without a Shabbos meal.</strong>
            We work every week to make sure that doesn&apos;t happen.
          </p>
        </div>

        {/* How it works cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {cards.map(({ emoji, title, desc }) => (
            <div key={title}
              className="bg-white rounded-3xl border-2 border-blue-100 p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-6xl mb-4">{emoji}</div>
              <h3 className="text-xl font-extrabold text-blue-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Values + visual */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ul className="space-y-4">
            {values.map((v) => (
              <li key={v} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-blue-100 shadow-sm text-gray-700 font-medium">
                {v}
              </li>
            ))}
          </ul>

          <div className="space-y-5">
            <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-3xl p-10 text-center text-white">
              <div className="text-7xl mb-4">🕯️</div>
              <h3 className="text-2xl font-extrabold mb-2">Shabbat Shalom!</h3>
              <p className="text-blue-200 text-sm">Bringing light to every Jewish home in Florida</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { emoji: "📅", value: "52",    label: "Weeks a Year" },
                { emoji: "🏠", value: "100%",  label: "Funds to Families" },
                { emoji: "💛", value: "Years",  label: "of Service" },
              ].map(({ emoji, value, label }) => (
                <div key={label} className="bg-white border-2 border-yellow-200 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="font-extrabold text-blue-900 text-lg">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
