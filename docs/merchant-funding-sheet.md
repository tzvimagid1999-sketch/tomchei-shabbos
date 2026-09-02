# Merchant funding campaign — offline donations sheet

For gifts that never went through the website: cheques, wires, pledges taken by
phone. They count towards the campaign goal and their names appear on the
supporter wall, alongside the card donations.

This is the same arrangement the main site uses for its Venmo/PayPal/Cash App
total, with one difference — this sheet carries **names** as well as amounts,
because the campaign page has a donor wall.

## 1. The sheet

Create a Google Sheet. First row is headers, one donation per row after that:

| Name | Amount | Notes |
|------|--------|-------|
| Berg Capital | 5000 | cheque, received 2 Sep |
| | 1800 | wire, donor wishes to stay anonymous |

- **Name** — exactly as it should appear on the wall. Leave it **blank** for an
  anonymous gift: the money still counts towards the goal, no name is shown.
- **Amount** — numbers only. No `$`, no commas.
- **Notes** — for your own records. Ignored by the website.

Only these two columns are read. Extra columns are ignored, so add whatever
else is useful to you.

## 2. The script

In the sheet: **Extensions → Apps Script**. Delete what is there, paste this,
and change `SECRET` to a long random string of your own.

```javascript
// Serves the campaign's offline donations to the website. Read-only.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

function doGet(e) {
  const out = (obj) => ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // Without this, the URL alone would expose the donor list to anyone.
  if (!e || !e.parameter || e.parameter.secret !== SECRET) {
    return out({ error: 'unauthorized' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const rows = sheet.getDataRange().getValues().slice(1); // drop the header row

  let total = 0;
  const donors = [];

  rows.forEach(function (row) {
    const name = String(row[0] == null ? '' : row[0]).trim();
    // Tolerates "$5,000" being typed in by hand.
    const amount = parseFloat(String(row[1]).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(amount) || amount <= 0) return;

    total += amount;
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

Redeploy for them to take effect.

## Notes

- Edits show on the site within about a minute.
- If the sheet is unreachable or misconfigured, the site falls back to card
  donations only rather than breaking. The reason is written to the Vercel logs.
- A name already on the wall from a card donation is not repeated here.
- Names are capped at 40 characters and square brackets are stripped, matching
  the rules for names entered on the website.
