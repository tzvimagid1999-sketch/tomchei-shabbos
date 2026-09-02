# Merchant funding campaign — offline donations sheet

For gifts that never went through the website: cheques, wires, pledges taken by
phone. They count towards the campaign goal and their names appear on the
supporter wall, alongside the card donations.

This is the same arrangement the main site uses for its Venmo/PayPal/Cash App
total, with one difference — this sheet carries **names** as well as amounts,
because the campaign page has a donor wall.

## 1. The sheet

Use the **existing** offline-donations sheet — the one already feeding the main
site's bar. Everything goes in one place; no second spreadsheet to keep in step.

Add two columns to it if they are not there already: **Campaign** and **Name**.

| Name | Amount | Campaign | Notes |
|------|--------|----------|-------|
| Berg Capital | 5000 | merchant-funding | cheque, received 2 Sep |
| | 1800 | merchant-funding | wire, donor wishes to stay anonymous |
| | 360 | | Venmo — ordinary donation |

- **Campaign** — put `merchant-funding` on rows for that campaign. Leave it
  blank for everything else. Case and spacing do not matter.
- **Name** — exactly as it should appear on the supporter wall. Leave it
  **blank** for an anonymous gift: the money still counts, no name is shown.
- **Amount** — `5000` or `$5,000`, either is read correctly.
- **Notes** — yours. Ignored by the website.

### Which bar does a row reach?

| Row | Main $250k bar | Merchant funding bar & wall |
|-----|----------------|------------------------------|
| Campaign blank | yes | no |
| Campaign = `merchant-funding` | yes | yes |

A merchant funding gift counting on both is deliberate: it is exactly how a card
donation through the campaign page already behaves. The same dollar shown in
two places.

## 2. The script

Your existing script keeps running untouched — it sums every row, so the main
bar picks up merchant funding gifts by itself.

Add a **second** script for the campaign. In the sheet:
**Extensions → Apps Script → the + beside "Files" → Script**, and paste this.
Change `SECRET` to a long random string of your own.

Columns are found by their header text, so the order does not matter and you can
rearrange the sheet freely.

```javascript
// Serves the merchant funding campaign's offline donations. Read-only.
// Lives alongside the existing script; it does not replace it.
const MF_SECRET = 'CHANGE-ME-to-a-long-random-string';
const MF_CAMPAIGN = 'merchant-funding';

function doGet(e) {
  const out = function (obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  };

  // Without this, the URL alone would expose the donor list to anyone.
  if (!e || !e.parameter || e.parameter.secret !== MF_SECRET) {
    return out({ error: 'unauthorized' });
  }

  const values = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
    .getDataRange().getValues();
  if (values.length < 2) return out({ total: 0, donors: [] });

  // Headers are matched by name, so columns can be in any order.
  const headers = values[0].map(function (h) {
    return String(h).trim().toLowerCase();
  });
  const col = function (name) { return headers.indexOf(name); };
  const iName = col('name');
  const iAmount = col('amount');
  const iCampaign = col('campaign');

  if (iAmount === -1 || iCampaign === -1) {
    return out({ error: 'sheet needs Amount and Campaign column headers' });
  }

  let total = 0;
  const donors = [];

  values.slice(1).forEach(function (row) {
    const campaign = String(row[iCampaign] || '').trim().toLowerCase();
    if (campaign !== MF_CAMPAIGN) return;

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

**Note:** a Google Sheet can only have one `doGet`. If your existing script
already has one, this new file will clash. In that case give this one a
different name — say `mfDonations(e)` — and call it from the existing `doGet`
when `e.parameter.campaign === 'merchant-funding'`. Send me the current script
and I will merge them properly.

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
