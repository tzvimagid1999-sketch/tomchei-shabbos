import Link from "next/link";

// The opt-in wording required by the SMS carrier registration (10DLC). Keep it
// exactly as written, and keep the box unchecked by default: consent must be an
// action the person takes, never a pre-ticked box.
export default function SmsConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-[13px] leading-relaxed text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#C8A75B]"
      />
      <span>
        By providing your phone number, you agree to receive text messages from Tomchei Shabbos of
        Florida. Message and data rates may apply. Message frequency varies. You can opt out at any
        time by replying STOP. Read our{" "}
        <Link href="/terms-and-conditions" className="underline hover:text-[#2D2D2D]">
          Terms and Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline hover:text-[#2D2D2D]">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
