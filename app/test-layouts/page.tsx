"use client";

export default function TestLayouts() {
  const tiers = [
    { value: 180, label: "$180", title: "A Sweet Start to the New Year", note: "Inspired by the sweetness of apples and honey and the call of the shofar during Elul, your donation helps bring warmth, dignity, and joy to a family this Rosh Hashanah." },
    { value: 250, label: "$250", title: "Share the Sweetness of Rosh Hashanah", note: "Your donation helps a family prepare for the New Year with the comfort and support they need to celebrate with dignity." },
    { value: 360, label: "$360", title: "Answer the Call of the Shofar", note: "As we reflect and prepare during Elul, your donation helps bring hope, happiness, and a brighter Rosh Hashanah to families in our community." },
    { value: 500, label: "$500", title: "Sweeten a Family's New Year", note: "Your donation helps ensure a family can welcome Rosh Hashanah with dignity, warmth, and the sweetness they deserve." },
    { value: 750, label: "$750", title: "Spread the Blessings of the New Year", note: "Help extend the spirit of Rosh Hashanah by bringing comfort and support to more families in need." },
    { value: 1000, label: "$1,000", title: "A Rosh Hashanah Community Sponsor", note: "Your generous donation helps make a meaningful difference for families as they begin the New Year." },
    { value: 1800, label: "$1,800", title: "A Greater Measure of Kindness", note: "During this sacred time of reflection and renewal, your donation helps bring greater support and sweetness to families throughout our community." },
    { value: 2500, label: "$2,500", title: "A Year of Blessing and Giving", note: "Your donation helps create lasting impact, allowing more families to experience the joy and dignity of Rosh Hashanah." },
    { value: 5000, label: "$5,000", title: "The Sweetest Blessing", note: "Your extraordinary donation helps bring hope, comfort, and support to many families as we enter a new year together." },
  ];

  // Simulated tracker bar
  const TrackerBar = () => (
    <div className="w-10 bg-gray-200 rounded border-2 border-black flex flex-col justify-end h-96">
      <div className="w-full bg-[#C9A961] h-1/3 rounded-b"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-[#C9A961]">Page Layout Options</h1>
      <p className="text-center text-gray-600 mb-12">How should we arrange the tracker and donation boxes?</p>

      <div className="space-y-20 max-w-full">

        {/* LAYOUT 1: Tracker Left, 2 Column Grid Right */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 1: Tracker Left, 2-Column Grid Right</h2>
          <div className="flex gap-8">
            {/* Tracker */}
            <div className="flex-shrink-0">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">🔔</p>
                <p className="text-xs font-bold text-gray-700">GOAL</p>
                <p className="text-lg font-bold text-[#C9A961]">$2.0M</p>
              </div>
              <TrackerBar />
              <div className="text-center mt-4">
                <p className="text-xs font-bold text-gray-700">RAISED</p>
                <p className="text-lg font-bold text-[#C9A961]">$0.00M</p>
              </div>
            </div>
            {/* Boxes */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              {tiers.map((tier) => (
                <div key={tier.value} className="bg-gray-50 border border-gray-300 rounded p-4">
                  <div className="text-2xl font-bold text-black mb-2">{tier.label}</div>
                  <p className="text-sm font-bold text-black mb-2">{tier.title}</p>
                  <p className="text-xs text-gray-700">{tier.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LAYOUT 2: Tracker Left, 3 Column Grid Right */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 2: Tracker Left, 3-Column Grid Right</h2>
          <div className="flex gap-8">
            {/* Tracker */}
            <div className="flex-shrink-0">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">🔔</p>
                <p className="text-xs font-bold text-gray-700">GOAL</p>
                <p className="text-lg font-bold text-[#C9A961]">$2.0M</p>
              </div>
              <TrackerBar />
              <div className="text-center mt-4">
                <p className="text-xs font-bold text-gray-700">RAISED</p>
                <p className="text-lg font-bold text-[#C9A961]">$0.00M</p>
              </div>
            </div>
            {/* Boxes */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <div key={tier.value} className="bg-gray-50 border border-gray-300 rounded p-4">
                  <div className="text-2xl font-bold text-black mb-2">{tier.label}</div>
                  <p className="text-sm font-bold text-black mb-2">{tier.title}</p>
                  <p className="text-xs text-gray-700">{tier.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LAYOUT 3: Tracker Top, Full Width Below */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 3: Tracker & Goal Info at Top, Full Width Grid Below</h2>

          {/* Top bar with tracker and info */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b">
            <div className="flex gap-12">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">🔔</p>
                <p className="text-xs font-bold text-gray-700">GOAL</p>
                <p className="text-lg font-bold text-[#C9A961]">$2.0M</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700">RAISED SO FAR</p>
                <p className="text-lg font-bold text-[#C9A961]">$0.00M</p>
              </div>
            </div>
            <div className="w-48 bg-gray-200 rounded border-2 border-black h-12 relative">
              <div className="absolute bottom-0 left-0 right-0 bg-[#C9A961] h-1/3 rounded-b"></div>
            </div>
          </div>

          {/* Full grid */}
          <div className="grid grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div key={tier.value} className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="text-2xl font-bold text-black mb-2">{tier.label}</div>
                <p className="text-sm font-bold text-black mb-2">{tier.title}</p>
                <p className="text-xs text-gray-700">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LAYOUT 4: Tracker Top Centered, 3-Column Below */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 4: Tracker Centered Top, 3-Column Below</h2>

          {/* Centered tracker at top */}
          <div className="flex justify-center mb-12">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">🔔</p>
              <div className="flex gap-8 justify-center mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-700">GOAL</p>
                  <p className="text-lg font-bold text-[#C9A961]">$2.0M</p>
                </div>
                <div className="w-40 bg-gray-200 rounded border-2 border-black h-20 relative">
                  <div className="absolute bottom-0 left-0 right-0 bg-[#C9A961] h-1/3 rounded-b"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">RAISED</p>
                  <p className="text-lg font-bold text-[#C9A961]">$0.00M</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid below */}
          <div className="grid grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div key={tier.value} className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="text-2xl font-bold text-black mb-2">{tier.label}</div>
                <p className="text-sm font-bold text-black mb-2">{tier.title}</p>
                <p className="text-xs text-gray-700">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LAYOUT 5: 2-Column Full Page */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 5: Boxes in 2 Columns (Current Style)</h2>

          <div className="grid grid-cols-2 gap-4">
            {tiers.map((tier) => (
              <div key={tier.value} className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="text-2xl font-bold text-black mb-2">{tier.label}</div>
                <p className="text-sm font-bold text-black mb-2">{tier.title}</p>
                <p className="text-xs text-gray-700">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LAYOUT 6: Tracker Left with Circular Boxes */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-3 border-[#C9A961]">Layout 6: Tracker Left, Boxes in Circle (NEW!)</h2>
          <div className="flex gap-12">
            {/* Tracker */}
            <div className="flex-shrink-0">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">🔔</p>
                <p className="text-xs font-bold text-gray-700">GOAL</p>
                <p className="text-lg font-bold text-[#C9A961]">$2.0M</p>
              </div>
              <TrackerBar />
              <div className="text-center mt-4">
                <p className="text-xs font-bold text-gray-700">RAISED</p>
                <p className="text-lg font-bold text-[#C9A961]">$0.00M</p>
              </div>
            </div>

            {/* Circular Grid */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative" style={{ width: "600px", height: "600px" }}>
                {/* Circle SVG for reference */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
                  <circle cx="300" cy="300" r="250" fill="none" stroke="#C9A961" strokeWidth="2" />
                </svg>

                {/* Boxes arranged in circle */}
                {tiers.map((tier, index) => {
                  const angle = (index / tiers.length) * 360;
                  const radius = 220;
                  const x = 300 + radius * Math.cos((angle - 90) * Math.PI / 180);
                  const y = 300 + radius * Math.sin((angle - 90) * Math.PI / 180);

                  return (
                    <div
                      key={tier.value}
                      className="absolute bg-gray-50 border border-gray-300 rounded p-3 w-32"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="text-lg font-bold text-black mb-1">{tier.label}</div>
                      <p className="text-xs font-bold text-black mb-1 line-clamp-2">{tier.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-20 p-8 bg-white rounded-lg shadow max-w-2xl mx-auto text-center border border-[#C9A961]">
        <p className="text-gray-700 font-bold mb-2">Which layout do you prefer?</p>
        <p className="text-sm text-gray-600">Tell me the layout number (1-5) and I'll update the page</p>
      </div>
    </div>
  );
}
