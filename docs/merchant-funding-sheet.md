# Merchant funding campaign — offline donations sheet

A separate sheet, just for the merchant funding campaign. For gifts that never
went through the website: cheques, wires, pledges taken by phone. They count
towards the campaign goal and their names appear on the supporter wall,
alongside the card donations.

Your existing offline sheet — the one feeding the main site's bar — is left
completely alone. This is a second, independent one.

**Worth knowing before you start.** A gift entered here reaches the **merchant
funding bar only**. It will not appear on the main $250k bar, whereas a card
donation through the campaign page counts on both. If you want a large cheque
on both, enter it in both sheets. See "Both bars" at the end.

## 1. The sheet

Create a **new** Google Sheet, named something like
"Merchant Funding — offline donations". First row is headers, one donation per
row after that:

| Name | Amount | Notes |
|------|--------|-------|
| Berg Capital | 5000 | cheque, received 2 Sep |
| | 1800 | wire, donor wishes to stay anonymous |

- **Name** — exactly as it should appear on the wall. Leave it **blank** for an
  anonymous gift: the money still counts towards the goal, no name is shown.
- **Amount** — `5000` or `$5,000`, either is read correctly.
- **Notes** — yours. Ignored by the website.

Only Name and Amount are read, and they are found by their header text, so you
can add columns and rearrange freely.

## 2. The script

In the new sheet: **Extensions → Apps Script**. Delete whatever is there, paste
this, and change `SECRET` to a long random string of your own.

Because this is its own sheet, there is no clash with the script on your
existing one.

```javascript
// Serves the merchant funding campaign's offline donations. Read-only.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

function doGet(e) {
  const out = function (obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  };

  // Without this, the URL alone would expose the donor list to anyone.
  if (!e || !e.parameter || e.parameter.secret !== SECRET) {
    return out({ error: 'unauthorized' });
  }

  const values = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
    .getDataRange().getValues();
  if (values.length < 2) return out({ total: 0, donors: [] });

  // Headers are matched by name, so columns can be in any order.
  const headers = values[0].map(function (h) {
    return String(h).trim().toLowerCase();
  });
  const iName = headers.indexOf('name');
  const iAmount = headers.indexOf('amount');

  if (iAmount === -1) {
    return out({ error: 'sheet needs an Amount column header' });
  }

  let total = 0;
  const donors = [];

  values.slice(1).forEach(function (row) {
    // Tolerates "$5,000" being typed in by hand.
    const amount = parseFloat(String(row[iAmount]).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(amount) || amount <= 0) return;

    total += amount;

    const name = iName === -1 ? '' : String(row[iName] || '').trim();
    if (name) donors.push({ name: name, amount: amount });
  });

  // Largest first, so the biggest supporters lead the wall.
  donors.sort(function (a, b) { return b.amount - a.amount; });

  return out({ total: total, donors: donors });
}
```

## 3. Publish it

**Deploy → New deployment → Web app**

- Execute as: **Me**
- Who has access: **Anyone**

Copy the web app URL it gives you.

"Anyone" sounds alarming but is required — Vercel calls this with no Google
login. The `secret` check is what actually protects it, which is why it must be
long and random.

## 4. Connect it

In Vercel → the project → **Settings → Environment Variables**, add both to
**Production**:

- `MERCHANT_FUNDING_SHEET_URL` — the web app URL from step 3
- `MERCHANT_FUNDING_SHEET_SECRET` — the same string you put in `SECRET`

Redeploy for them to take effect. Until both are set, nothing changes on the
site, so there is no way for this to half-work.

## Both bars

A row in this sheet counts on the merchant funding bar only. To have a gift on
the main $250k bar as well, add it to your existing offline sheet too — the two
are independent, so a row in each is what makes it appear in both places.

Only do that for gifts that genuinely belong on both. Entering a row twice in
the *same* sheet counts it twice on the same bar.

## Notes

- Edits show on the site within about a minute.
- If the sheet is unreachable or misconfigured, the site falls back to card
  donations only rather than breaking. The reason is written to the Vercel logs.
- A name already on the wall from a card donation is not repeated.
- Names are capped at 40 characters and square brackets are stripped, matching
  the rules for names entered on the website.
