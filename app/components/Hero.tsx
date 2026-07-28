export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 pt-16">

      {/* Elegant decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-32 h-32 border border-yellow-400/20 rounded-full pointer-events-none" />
      <div className="absolute top-16 right-16 w-20 h-20 border border-yellow-400/10 rounded-full pointer-events-none" />
      <div className="absolute bottom-32 left-10 w-24 h-24 border border-white/10 rounded-full pointer-events-none" />
      <div className="absolute bottom-40 left-16 w-12 h-12 border border-white/10 rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Big emoji */}
        <div className="text-8xl mb-6 animate-float">🍞</div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-sm px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Non-Profit Organization — Florida
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          Every Family Deserves a{" "}
          <span className="text-yellow-400">Beautiful Shabbos</span> ✨
        </h1>

        <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tomchei Shabbos Florida delivers food packages to families in need —
          so every home can light candles, make Kiddush, and share a Shabbos meal together. 🕯️
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#donate"
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-blue-900 px-10 py-4 rounded-full text-lg font-extrabold hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl shadow-yellow-900/30">
            💛 Donate Now
          </a>
          <a href="#volunteer"
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur text-white border-2 border-white/30 px-10 py-4 rounded-full text-lg font-bold hover:bg-white/20 transition-all">
            🙋 Volunteer
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { emoji: "👨‍👩‍👧‍👦", value: "350", label: "Families Helped" },
            { emoji: "🍽️",        value: "10K+", label: "Meals Provided" },
            { emoji: "🙌",        value: "200+", label: "Volunteers" },
          ].map(({ emoji, value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl mb-1">{emoji}</div>
              <div className="text-3xl font-extrabold text-yellow-400">{value}</div>
              <div className="text-blue-200 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
          <path d="M0 80L60 72C120 64 240 48 360 44C480 40 600 48 720 52C840 56 960 56 1080 52C1200 48 1320 40 1380 36L1440 32V80H0Z" fill="#eff6ff"/>
        </svg>
      </div>
    </section>
  );
}
