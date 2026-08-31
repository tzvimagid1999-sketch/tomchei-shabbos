import Image from "next/image";

export const metadata = {
  title: "Thank You | Tomchei Shabbos of Florida",
  // Part of the unlisted campaign, and a bare confirmation page has no business
  // in search results anyway.
  robots: { index: false, follow: false },
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; amount?: string; monthly?: string }>;
}) {
  const sp = await searchParams;

  // Everything here comes off the query string, so treat it as untrusted:
  // show a first name only, and only if it looks like one.
  const raw = (sp.name || "").trim();
  const name = /^[A-Za-z][A-Za-z'’-]{0,30}$/.test(raw) ? raw : "";

  const parsed = Number(sp.amount);
  const amount = Number.isFinite(parsed) && parsed > 0 && parsed < 1_000_000 ? parsed : null;
  const monthly = sp.monthly === "1";

  return (
    <div
      className="mf flex min-h-screen flex-col"
      style={{
        backgroundColor: "#FBF8F3",
        color: "#2D2D2D",
        fontFamily: "var(--font-dm), ui-sans-serif, system-ui, sans-serif",
        fontWeight: 500,
      }}
    >
      <header className="flex w-full items-center px-5 py-5 sm:px-8">
        <a href="/merchant-funding" className="flex items-center">
          <Image
            src="/logo-transparent.png"
            alt="Tomchei Shabbos of Florida"
            width={670}
            height={120}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8 sm:py-24">
        <div className="w-full max-w-[46rem] text-center">
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{ opacity: 0.55 }}>
            Donation received
          </p>

          <h1
            className="mf-display mt-6 text-[clamp(2.4rem,6vw,4.5rem)]"
            style={{ color: "#2D2D2D" }}
          >
            Thank you{name && <>, <span style={{ color: "#A08243" }}>{name}</span></>}.
          </h1>

          <p lang="he" dir="rtl" className="mf-hebrew mt-8 text-[clamp(1.6rem,4.5vw,2.6rem)]" style={{ color: "#A08243" }}>
            שנה טובה ומתוקה
          </p>

          <span className="mx-auto mt-8 block h-px w-24" style={{ backgroundColor: "#C8A75B" }} />

          <p className="mx-auto mt-8 max-w-[34rem] text-[17px] leading-[1.65]" style={{ opacity: 0.8 }}>
            {amount !== null ? (
              <>
                Your {monthly ? "monthly gift" : "gift"} of{" "}
                <strong style={{ opacity: 1 }}>{money(amount)}</strong>
                {monthly && " a month"} went through
                {monthly && ", and will repeat automatically until you tell us to stop"}.
              </>
            ) : (
              <>Your gift went through.</>
            )}{" "}
            A receipt is on its way to your inbox — keep it for your records, it is your
            tax documentation.
          </p>

          <p className="mx-auto mt-6 max-w-[34rem] text-[17px] leading-[1.65]" style={{ opacity: 0.8 }}>
            This week a family in South Florida will have food on their table for Shabbos
            because of you.
          </p>

        </div>
      </main>

      <footer className="px-5 py-14 sm:px-8" style={{ backgroundColor: "#0a6e78", color: "#FFFFFF" }}>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mf-display text-[1.6rem]">Tomchei Shabbos of Florida</p>
            <address className="mt-3 text-[15px] not-italic" style={{ opacity: 0.75 }}>
              194 NE 186th Terrace<br />North Miami Beach, FL 33179
            </address>
          </div>
          <div className="text-[15px] sm:text-right" style={{ opacity: 0.75 }}>
            <p>501(c)(3) tax-exempt organization · Tax ID 83-2155012</p>
            <p className="mt-2">Donations are tax-deductible to the extent allowed by law.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
