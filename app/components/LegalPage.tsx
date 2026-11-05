// Shared shell for the Privacy Policy and Terms pages.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pt-20 bg-white min-h-screen">
      <section className="bg-[#F8F4EC] border-b border-[#E8DFC8]">
        <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-[#2D2D2D] mb-3">{title}</h1>
          <p className="text-sm text-gray-500">Last updated: {updated}</p>
        </div>
      </section>
      <article className="max-w-3xl mx-auto px-6 py-10 sm:py-14 text-[16px] leading-relaxed text-[#2D2D2D] space-y-4 [&_h2]:font-playfair [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:text-[#0a6e78]">
        {children}
      </article>
    </main>
  );
}
