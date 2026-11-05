import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { CONTACT_EMAIL, MAILING } from "../lib/contact-info";

export const metadata = {
  alternates: { canonical: "/privacy-policy" },
  title: "Privacy Policy | Tomchei Shabbos of Florida",
  description:
    "How Tomchei Shabbos of Florida collects, uses and protects your information, including your phone number and text message consent.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 4, 2026">
      <p>
        Tomchei Shabbos of Florida (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a 501(c)(3) nonprofit
        that provides food packages to families in need. This policy explains what information we collect through
        tomcheishabbosflorida.org, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Donations:</strong> your name, email, phone number (optional), billing address, the amount, and any
          dedication you choose to add.
        </li>
        <li>
          <strong>Applications for assistance:</strong> household and contact details you provide so we can review your
          request. We treat these with discretion and use them only to evaluate and deliver assistance.
        </li>
        <li>
          <strong>Volunteer sign-ups and contact messages:</strong> your name, email, phone number, and what you write
          to us.
        </li>
        <li>
          <strong>Technical information:</strong> basic details sent by your browser, such as your IP address and
          device type, used to keep the site working and secure. We do not run advertising or marketing trackers on
          this site.
        </li>
      </ul>

      <h2>Card payments</h2>
      <p>
        Card details are entered into a secure field provided by our payment processor, USAePay (MerchPay). Your card
        number is sent directly to them and is never stored on our website or our servers. We keep a record of the
        donation (amount, date, name, and receipt details) so we can send you a receipt and keep our books.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To process donations and send receipts and confirmations.</li>
        <li>To review applications and deliver food packages.</li>
        <li>To coordinate volunteers and answer your messages.</li>
        <li>To keep the website secure and prevent fraud and spam.</li>
        <li>To send text messages, only if you have agreed to receive them (see below).</li>
      </ul>

      <h2>Text messages (SMS)</h2>
      <p>
        If you give us your phone number and agree to receive texts, we may send you text messages from Tomchei Shabbos
        of Florida, such as confirmations, scheduling and delivery updates, and occasional updates about our work.
        Message and data rates may apply, and message frequency varies.
      </p>
      <ul>
        <li>
          <strong>Opting out:</strong> reply <strong>STOP</strong> at any time and we will stop texting you. Reply{" "}
          <strong>HELP</strong> for help.
        </li>
        <li>
          <strong>No sharing for marketing:</strong> we do not sell, rent, or share your phone number or text-message
          consent with third parties or affiliates for their marketing or promotional purposes.
        </li>
        <li>
          Consent to receive text messages is not a condition of making a donation or applying for assistance.
        </li>
      </ul>

      <h2>Who we share information with</h2>
      <p>
        We share information only with the service providers that help us run the site and our work, and only as needed
        for them to do so: our payment processor (USAePay / MerchPay), our email provider, our web hosting provider
        (Vercel), our text-messaging provider, and Cloudflare (which checks that a visitor is a person before a donation
        is submitted). We may also disclose information if the law requires it. We do not sell your personal
        information.
      </p>

      <h2>Keeping your information safe</h2>
      <p>
        The site uses encrypted connections (HTTPS), and we limit who can see donor and applicant information to the
        people who need it. No system is perfectly secure, but we take reasonable steps to protect what you share.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to see, correct, or delete the personal information we hold about you, or to stop contacting you,
        by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may need to keep some records, such as
        donation receipts, as the law requires.
      </p>

      <h2>Children</h2>
      <p>This site is not meant for children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The date at the top shows when it last changed. See also our{" "}
        <Link href="/terms-and-conditions">Terms and Conditions</Link>.
      </p>

      <h2>Contact us</h2>
      <p>
        Tomchei Shabbos of Florida
        <br />
        {MAILING.street}, {MAILING.cityStateZip}
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
