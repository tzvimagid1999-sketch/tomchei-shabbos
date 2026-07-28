import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string }>;
}) {
  const { amount: amountParam } = await searchParams;
  const amount = amountParam ? `$${amountParam}` : "your donation";

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-12 max-w-lg w-full text-center shadow-2xl">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <div className="text-6xl mb-4">💙</div>
        <h1 className="text-3xl font-extrabold text-blue-900 mb-3">
          Thank You So Much!
        </h1>
        <p className="text-gray-600 text-lg mb-2">
          Your donation of <strong className="text-blue-700">{amount}</strong> was received successfully.
        </p>
        <p className="text-gray-500 mb-8">
          Because of you, a family will have food on their Shabbos table this week.<br />
          <strong>Shabbat Shalom!</strong>
        </p>

        <div className="bg-blue-50 rounded-2xl p-5 mb-8 border border-blue-100">
          <p className="text-blue-800 text-sm font-medium">
            A receipt has been sent to your email. This donation may be tax-deductible — please consult your tax advisor.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-extrabold text-lg hover:bg-yellow-300 transition-colors"
        >
          ⭐ Back to Home
        </Link>
      </div>
    </main>
  );
}
