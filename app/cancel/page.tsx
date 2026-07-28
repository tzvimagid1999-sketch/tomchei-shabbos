import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-12 max-w-lg w-full text-center shadow-2xl">
        <div className="text-7xl mb-6">💙</div>
        <h1 className="text-3xl font-extrabold text-blue-900 mb-3">
          No Problem!
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          Your payment was cancelled. We&apos;d love to have your support whenever you&apos;re ready —
          every donation makes a real difference. 🙏
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/#donate"
            className="inline-block bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-extrabold text-lg hover:bg-yellow-300 transition-colors"
          >
            💛 Try Again
          </Link>
          <Link
            href="/"
            className="inline-block bg-blue-100 text-blue-800 px-8 py-4 rounded-full font-bold text-base hover:bg-blue-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
