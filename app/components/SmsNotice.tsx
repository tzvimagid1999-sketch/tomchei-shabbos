import Link from "next/link";

// Shown just above the Submit button on forms that collect a phone number. It
// is the carrier-required opt-in wording, so it must sit where the person can
// see it before submitting, not only in the policies. Keep the Terms and
// Privacy Policy wording in step with this.
export default function SmsNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-relaxed text-gray-500 ${className}`}>
      By submitting this form, you agree to receive text messages from Tomchei Shabbos of Florida at the phone number
      you provide. Message and data rates may apply. Message frequency varies. You can opt out at any time by replying
      STOP. Read our{" "}
      <Link href="/terms-and-conditions" className="underline hover:text-gray-700">
        Terms and Conditions
      </Link>{" "}
      and{" "}
      <Link href="/privacy-policy" className="underline hover:text-gray-700">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
