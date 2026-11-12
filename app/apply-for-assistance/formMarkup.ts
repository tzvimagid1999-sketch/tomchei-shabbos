// The family application form, ported verbatim from the supplied
// Family-Application-Form.html (markup and styles). The only additions are the
// carrier-required text-message consent checkbox and the .fa style scoping.
export const FORM_CSS = `
   .fa{
    --bg:#f6f3ee; --card:#ffffff; --ink:#1f2a37; --muted:#5f6b7a; --line:#e3ddd3;
    --accent:#1e4d6b; --accent-soft:#e8f0f5; --err:#b42318; --ok:#1d6b45;
  }
  .fa *{box-sizing:border-box}
  .fa{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,system-ui,sans-serif}
.fa .wrap{max-width:780px;margin:0 auto;padding:40px 20px 80px}
.fa header{margin-bottom:28px}
.fa h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:34px;margin:0 0 6px;letter-spacing:-.01em}
.fa header p{margin:0;color:var(--muted)}
.fa section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:18px}
.fa section h2{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:20px;margin:0 0 4px;display:flex;align-items:center;gap:10px}
.fa .num{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font:600 13px Inter,sans-serif}
.fa .hint{color:var(--muted);font-size:13.5px;margin:0 0 16px}
.fa .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}
.fa .full{grid-column:1/-1}
  @media (max-width:600px){.fa .grid{grid-template-columns:1fr}}
.fa label{display:block;font-weight:500;font-size:13.5px;margin-bottom:5px}
.fa .req::after{content:" *";color:var(--err)}
.fa input[type=text],.fa input[type=email],.fa input[type=tel],.fa input[type=number],.fa select,.fa textarea{
    width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;font:inherit;color:inherit;background:#fdfcfa}
.fa input:focus,.fa select:focus,.fa textarea:focus{outline:2px solid var(--accent);outline-offset:-1px;background:#fff}
.fa .money{position:relative}
.fa .money span{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)}
.fa .money input{padding-left:24px}
.fa .seg{display:flex;gap:10px;flex-wrap:wrap}
.fa .seg label{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:9px;padding:10px 14px;cursor:pointer;font-weight:500;margin:0;background:#fdfcfa}
.fa .seg input{accent-color:var(--accent)}
.fa .seg label:has(input:checked){border-color:var(--accent);background:var(--accent-soft)}
.fa .checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.fa .checks label{display:flex;gap:8px;align-items:center;font-weight:400;margin:0}
.fa .sub{border-top:1px dashed var(--line);margin-top:18px;padding-top:16px}
.fa .sub h3{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 12px;font-weight:600}
.fa .hidden{display:none !important}
.fa .child{border:1px solid var(--line);border-radius:12px;padding:16px;margin-top:12px;background:#fbfaf7}
.fa .child h4{margin:0 0 12px;font-size:15px;color:var(--accent)}
.fa .err-msg{color:var(--err);font-size:12.5px;margin-top:4px}
.fa .invalid{border-color:var(--err) !important}
.fa .actions{display:flex;gap:12px;justify-content:flex-end;margin-top:8px}
.fa button{font:600 15px Inter,sans-serif;border-radius:10px;padding:12px 22px;cursor:pointer;border:1px solid var(--accent)}
.fa .primary{background:var(--accent);color:#fff}
.fa .ghost{background:transparent;color:var(--accent)}
.fa .banner{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:14px}
.fa .banner.err{background:#fdecea;color:var(--err)}
.fa .banner.ok{background:#e7f4ec;color:var(--ok)}
.fa #review table{width:100%;border-collapse:collapse;font-size:14px}
.fa #review td{padding:7px 0;border-bottom:1px solid var(--line);vertical-align:top}
.fa #review td:first-child{color:var(--muted);width:42%;padding-right:12px}
.fa #review h3{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:17px;margin:20px 0 6px}
.fa .file-note{font-size:12.5px;color:var(--muted);margin-top:6px}

  .fa .consent{display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:13px;color:var(--muted);margin:4px 0 14px;cursor:pointer}
  .fa .consent input{margin-top:3px;accent-color:var(--accent)}
  .fa .consent a{color:var(--accent);text-decoration:underline}
`;

export const FORM_HTML = `<div class="wrap">
  <header>
    <h1>Family Application</h1>
    <p>Please complete every section. Fields marked <span style="color:var(--err)">*</span> are required.</p>
  </header>

  <form id="app" novalidate>
    <div id="topErr" class="banner err hidden"></div>

    <!-- 1. Status -->
    <section>
      <h2><span class="num">1</span>Application status</h2>
      <p class="hint">Are you applying for the first time, or have you applied before?</p>
      <div class="seg" data-req-radio="status">
        <label><input type="radio" name="status" value="New application"> New application</label>
        <label><input type="radio" name="status" value="Reapplying"> Reapplying</label>
      </div>
    </section>

    <!-- 2. Applicant -->
    <section>
      <h2><span class="num">2</span>Applicant information</h2>
      <p class="hint">Your contact details.</p>
      <div class="grid">
        <div><label class="req" for="firstName">First name</label><input type="text" id="firstName" name="First name" required></div>
        <div><label class="req" for="lastName">Last name</label><input type="text" id="lastName" name="Last name" required></div>
        <div><label class="req" for="email">Email</label><input type="email" id="email" name="Email" required></div>
        <div><label class="req" for="phone">Phone</label><input type="tel" id="phone" name="Phone" required></div>
      </div>
    </section>

    <!-- 3. Spouse -->
    <section>
      <h2><span class="num">3</span>Spouse information</h2>
      <div class="grid">
        <div><label class="req" for="spFirst">Spouse first name</label><input type="text" id="spFirst" name="Spouse first name" required></div>
        <div><label class="req" for="spLast">Spouse last name</label><input type="text" id="spLast" name="Spouse last name" required></div>
        <div><label for="spEmail">Spouse email</label><input type="email" id="spEmail" name="Spouse email"></div>
        <div><label class="req" for="spPhone">Spouse phone</label><input type="tel" id="spPhone" name="Spouse phone" required></div>
      </div>
    </section>

    <!-- 4. Address -->
    <section>
      <h2><span class="num">4</span>Home address</h2>
      <div class="grid">
        <div class="full"><label class="req" for="street">Street address</label><input type="text" id="street" name="Street address" required></div>
        <div class="full"><label for="apt">Apt / Unit</label><input type="text" id="apt" name="Apt / Unit"></div>
        <div><label class="req" for="city">City</label><input type="text" id="city" name="City" required></div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
          <div><label class="req" for="state">State</label><input type="text" id="state" name="State" maxlength="2" required></div>
          <div><label class="req" for="zip">ZIP</label><input type="text" id="zip" name="ZIP" inputmode="numeric" maxlength="10" required></div>
        </div>
      </div>
    </section>

    <!-- 5. Employment & income -->
    <section>
      <h2><span class="num">5</span>Employment &amp; income</h2>
      <p class="hint">Occupation and yearly earnings for the applicant and spouse.</p>

      <div class="sub" style="border-top:none;margin-top:0;padding-top:0">
                <div class="grid">
          <div class="full">
            <label class="req">Currently employed?</label>
            <div class="seg" data-req-radio="hEmployed">
              <label><input type="radio" name="hEmployed" value="Yes"> Yes</label>
              <label><input type="radio" name="hEmployed" value="No"> No</label>
            </div>
          </div>
          <div class="full"><label for="hPosition">Occupation</label><input type="text" id="hPosition" name="Applicant occupation" placeholder="What is your occupation?"></div>
          <div class="full"><label class="req" for="hYearly">Yearly earnings (before taxes)</label><div class="money"><span>$</span><input type="number" min="0" step="1" id="hYearly" name="Applicant yearly earnings" required></div></div>
        </div>
      </div>

      <div class="sub">
        <h3>Spouse</h3>
        <div class="grid">
          <div class="full">
            <label class="req">Currently employed?</label>
            <div class="seg" data-req-radio="wEmployed">
              <label><input type="radio" name="wEmployed" value="Yes"> Yes</label>
              <label><input type="radio" name="wEmployed" value="No"> No</label>
            </div>
          </div>
          <div class="full"><label for="wPosition">Occupation</label><input type="text" id="wPosition" name="Spouse occupation" placeholder="What is your spouse’s occupation?"></div>
          <div class="full"><label class="req" for="wYearly">Yearly earnings (before taxes)</label><div class="money"><span>$</span><input type="number" min="0" step="1" id="wYearly" name="Spouse yearly earnings" required></div></div>
        </div>
      </div>
      <p class="hint" style="margin:14px 0 0">Combined household earnings: <strong id="combined">$0</strong></p>
    </section>

    <!-- 6. Assistance -->
    <section>
      <h2><span class="num">6</span>Government assistance</h2>
      <div class="grid">
        <div class="full">
          <label class="req">Do you receive food stamps (SNAP)?</label>
          <div class="seg" data-req-radio="snap">
            <label><input type="radio" name="snap" value="Yes"> Yes</label>
            <label><input type="radio" name="snap" value="No"> No</label>
          </div>
        </div>
        <div class="full" id="snapAmtWrap"><label class="req" for="snapAmt">If yes, what amount per month?</label><div class="money" style="max-width:320px"><span>$</span><input type="number" min="0" step="1" id="snapAmt" name="SNAP monthly amount" required></div></div>
        <div class="full">
          <label class="req">Do you receive any other government assistance?</label>
          <div class="seg" data-req-radio="otherAssist">
            <label><input type="radio" name="otherAssist" value="Yes"> Yes</label>
            <label><input type="radio" name="otherAssist" value="No"> No</label>
          </div>
        </div>
        <div class="full" id="assistList">
          <label>Which programs? (check all that apply)</label>
          <div class="checks">
            <label><input type="checkbox" name="assist" value="Medicaid"> Medicaid</label>
            <label><input type="checkbox" name="assist" value="WIC"> WIC</label>
            <label><input type="checkbox" name="assist" value="Section 8 / housing assistance"> Section 8 / housing</label>
            <label><input type="checkbox" name="assist" value="SSI / SSD"> SSI / SSD</label>
            <label><input type="checkbox" name="assist" value="Cash assistance (TANF)"> Cash assistance (TANF)</label>
            <label><input type="checkbox" name="assist" value="HEAP / utility assistance"> HEAP / utility assistance</label>
            <label><input type="checkbox" name="assist" value="Unemployment"> Unemployment</label>
            <label><input type="checkbox" name="assist" value="Child care subsidy"> Child care subsidy</label>
          </div>
          <div style="margin-top:12px"><label for="assistOther">Other (please describe)</label><input type="text" id="assistOther" name="Other assistance"></div>
        </div>
      </div>
    </section>

    <!-- 7. Housing -->
    <section>
      <h2><span class="num">7</span>Rent or mortgage</h2>
      <div class="grid">
        <div class="full"><label class="req" for="housingCost">What is your monthly rent or mortgage payment?</label><div class="money" style="max-width:320px"><span>$</span><input type="number" min="0" step="1" id="housingCost" name="Monthly rent / mortgage" required></div></div>
      </div>
    </section>

    <!-- 8. Children -->
    <section>
      <h2><span class="num">8</span>Children</h2>
      <p class="hint">Choose how many, then enter each child’s name, gender and age.</p>
      <div class="grid">
        <div><label class="req" for="numKids">How many children do you have?</label>
          <select id="numKids" name="Number of children" required></select>
        </div>
      </div>
      <div id="kids"></div>
    </section>

    <!-- 9. Shul -->
    <section>
      <h2><span class="num">9</span>Shul &amp; Rabbi</h2>
      <div class="grid">
        <div class="full"><label class="req" for="shul">Name of shul</label><input type="text" id="shul" name="Name of shul" required></div>
        <div><label class="req" for="rabbi">Name of Rabbi</label><input type="text" id="rabbi" name="Rabbi name" required></div>
        <div><label class="req" for="rabbiPhone">Rabbi’s Phone Number</label><input type="tel" id="rabbiPhone" name="Rabbi phone" required></div>
        <div><label for="rabbiEmail">Rabbi's email</label><input type="email" id="rabbiEmail" name="Rabbi email"></div>
      </div>
    </section>

    <!-- 10. Notes -->
    <section>
      <h2><span class="num">10</span>Anything you’d like to add</h2>
      <p class="hint">Optional.</p>
      <textarea id="notes" name="Notes" rows="5"></textarea>
    </section>

    <label class="consent"><input type="checkbox" id="smsConsent"><span>By checking this box, I agree to receive text messages from Tomchei Shabbos of Florida Corp. at the phone number provided. These messages include replies to my inquiry, updates about donations, volunteering and assistance applications. Message frequency varies. Message and data rates may apply. Reply STOP at any time to opt out, or HELP for help. Consent is not a condition of making a donation or applying for assistance. See our <a href="/terms-and-conditions" target="_blank">Terms and Conditions</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.</span></label>

    <div class="actions">
      <button type="button" class="ghost" id="resetBtn">Clear form</button>
      <button type="submit" class="primary">Review application</button>
    </div>
  </form>

  <!-- Review -->
  <div id="reviewWrap" class="hidden">
    <div class="banner ok">Please review your answers below, then press <strong>Submit application</strong>.</div>
    <div id="sendErr" class="banner err hidden"></div>
    <section id="review"></section>
    <div class="actions">
      <button type="button" class="ghost" id="editBtn">Edit answers</button>
      <button type="button" class="primary" id="submitBtn">Submit application</button>
    </div>
  </div>

  <!-- Done -->
  <div id="doneWrap" class="hidden">
    <section style="text-align:center;padding:48px 24px">
      <h2 style="justify-content:center;font-size:26px;margin-bottom:8px">Thank you!</h2>
      <p class="hint" style="margin:0">Your application has been submitted. We will be in touch.</p>
    </section>
  </div>
</div>`;
