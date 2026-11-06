import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { CONTACT_EMAIL, MAILING } from "../lib/contact-info";

export const metadata = {
  alternates: { canonical: "/terms-and-conditions" },
  title: "Terms and Conditions | Tomchei Shabbos of Florida",
  description:
    "Terms for using the Tomchei Shabbos of Florida website, donating, and receiving text messages from us.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updated="November 4, 2026">
      <p>
        These terms apply when you use tomcheishabbosflorida.org, make a donation, or receive text messages from
        Tomchei Shabbos of Florida (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using the site you
        agree to them. Please also read our <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>Donations</h2>
      <ul>
        <li>
          Tomchei Shabbos of Florida is a 501(c)(3) nonprofit, Tax ID 83-2155012. Donations are tax-deductible to the
          extent the law allows, and no goods or services are provided in exchange for them.
        </li>
        <li>
          Monthly gifts continue until the number of months you chose is reached, or until you cancel. You can cancel a
          monthly gift using the link in your confirmation email, or by contacting us.
        </li>
        <li>
          If you believe a donation was made in error, contact us as soon as possible and we will work with you.
        </li>
      </ul>

      <h2>Applications for assistance</h2>
      <p>
        Submitting an application does not guarantee assistance. We review each request and decide based on need and
        available resources. Please give accurate information. Applications are handled with discretion.
      </p>

      <h2>Text message program</h2>
      <p>
        <strong>Program:</strong> Tomchei Shabbos of Florida text messages. If you provide your phone number, we may send
        you messages such as confirmations, scheduling and delivery updates, volunteer coordination, and occasional
        updates about our work.
      </p>
      <ul>
        <li>
          <strong>Consent:</strong> by providing your phone number and checking the consent box on our donation,
          volunteer, assistance application or contact forms, you agree to receive these text messages. Consent is not
          a condition of making a donation, volunteering, or applying for assistance.
        </li>
        <li>
          <strong>Message frequency</strong> varies. <strong>Message and data rates may apply.</strong>
        </li>
        <li>
          <strong>Opt out:</strong> reply <strong>STOP</strong> at any time to stop receiving messages. You may receive
          one final message confirming your request.
        </li>
        <li>
          <strong>Help:</strong> reply <strong>HELP</strong> or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
        <li>
          Wireless carriers are not liable for delayed or undelivered messages. Message delivery depends on your carrier
          and device.
        </li>
        <li>
          We do not sell or share your phone number or consent with third parties or affiliates for their marketing or
          promotional purposes. See our <Link href="/privacy-policy">Privacy Policy</Link>.
        </li>
      </ul>

      <h2>Using the website</h2>
      <p>
        Please use the site only for lawful purposes. Do not try to disrupt it, test stolen or invalid payment cards,
        or submit false information. We may block access or refuse a transaction that looks fraudulent.
      </p>

      <h2>No warranty and limits on liability</h2>
      <p>
        The site is provided &ldquo;as is.&rdquo; To the fullest extent the law allows, we are not liable for
        indirect or incidental losses arising from your use of the site. Nothing here limits any right you have under
        the law that cannot be waived.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. The date at the top shows when they last changed. Continuing to
        use the site after a change means you accept the updated terms.
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
