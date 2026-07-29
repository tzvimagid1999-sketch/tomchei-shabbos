"use client";

export default function ColorPreview() {
  const colors = [
    { name: "Soft Red", hex: "#E57373" },
    { name: "Rose Red", hex: "#FF6B6B" },
    { name: "Coral Red", hex: "#FF8A80" },
    { name: "Crimson Light", hex: "#EF5350" },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Color Preview - "Rosh Hashanah Campaign"</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {colors.map((color) => (
          <div key={color.hex} className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">{color.name}</h2>
            <p className="text-sm text-gray-500 mb-6">{color.hex}</p>

            <div className="bg-gradient-to-b from-[#FDF9F7] to-white p-8 rounded-lg border border-gray-200 text-center">
              <span className="font-caveat text-4xl tracking-wide" style={{ color: color.hex }}>
                Rosh Hashanah Campaign
              </span>
              <p className="text-gray-600 text-sm mt-6">This is how it looks on the page</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center text-gray-600">
        <p className="text-sm">Tell me which color you like best!</p>
      </div>
    </main>
  );
}
