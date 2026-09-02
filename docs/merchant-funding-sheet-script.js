/**
 * Merchant funding campaign — offline donations.
 *
 * Paste this into YOUR sheet: Extensions -> Apps Script. Read-only: it can
 * only read the sheet, never change it, and never touches payments.
 *
 * Written for these column headers, in any order, with or without the stray
 * trailing spaces they currently have:
 *
 *   Date | Platform | First Name | Last Name | Amount
 *
 * The wall name is "First Last". Leave BOTH name columns blank for an
 * anonymous gift — the money still counts towards the goal, no name is shown.
 */

// CHANGE THIS to a long random string of your own, then keep a copy: the same
// string goes into Vercel. It is what stops anyone with the URL reading your
// donor list.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

function doGet(e) {
  const out = function (obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  };

  if (!e || !e.parameter || e.parameter.secret !== SECRET) {
    return out({ error: 'unauthorized' });
  }

  const values = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
    .getDataRange().getValues();
  if (values.length < 2) return out({ total: 0, donors: [] });

  // Headers are matched by name and trimmed, so column order can change and
  // "Date " with its trailing space still matches.
  const headers = values[0].map(function (h) {
    return String(h).trim().toLowerCase();
  });
  const iFirst = headers.indexOf('first name');
  const iLast = headers.indexOf('last name');
  const iAmount = headers.indexOf('amount');

  if (iAmount === -1) {
    return out({ error: 'no Amount column found' });
  }

  var total = 0;
  const donors = [];

  values.slice(1).forEach(function (row) {
    // Tolerates "$5,000" being typed in by hand.
    const amount = parseFloat(String(row[iAmount]).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(amount) || amount <= 0) return;

    total += amount;

    const first = iFirst === -1 ? '' : String(row[iFirst] || '').trim();
    const last = iLast === -1 ? '' : String(row[iLast] || '').trim();
    const name = (first + ' ' + last).trim();
    if (name) donors.push({ name: name, amount: amount });
  });

  // Largest first, so the biggest supporters lead the wall.
  donors.sort(function (a, b) { return b.amount - a.amount; });

  return out({ total: total, donors: donors });
}
