// Shared contact details, so the address and inbox are defined once and can be
// reused by the contact page, the contact API and anywhere else that needs them.
//
// General enquiries inbox. Shown on the contact page and used as the delivery
// address for the contact form.
//
// info@ is being created today. Until it exists the form will report success
// while the mail bounces, which the organisation has accepted knowingly.
export const CONTACT_EMAIL = "info@tomcheishabbosflorida.org";

export const MAILING = {
  payableTo: "Tomchei Shabbos of Florida",
  street: "194 NE 186th Terrace",
  cityStateZip: "North Miami Beach, FL 33179",
};
