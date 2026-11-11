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
        By checking this box, I agree to receive text messages from Tomchei Shabbos of Florida Corp.
        at the phone number provided. These messages include replies to my inquiry, updates about
        donations, volunteering and assistance applications. Message frequency varies. Message and
        data rates may apply. Reply STOP at any time to opt out, or HELP for help. Consent is not a
        condition of making a donation or applying for assistance. See our{" "}
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
