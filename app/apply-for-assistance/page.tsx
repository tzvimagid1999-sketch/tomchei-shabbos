"use client";
import { useEffect, useRef } from "react";
import { FORM_CSS, FORM_HTML } from "./formMarkup";

// The family application form, copied from the supplied Family-Application-Form.html.
// Markup and styles live in formMarkup.ts; the form's own logic (children cards,
// show/hide questions, validation, review step) is the original script, scoped to
// this page. Only the final submit differs: it posts to /api/apply-assistance,
// which emails the application and logs it to the sheet, instead of a Google
// Apps Script address.
export default function ApplyForAssistancePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || root.dataset.wired) return;
    root.dataset.wired = "1";

    const $ = (s: string) => root.querySelector(s) as HTMLElement & HTMLInputElement & HTMLSelectElement;
    const $$ = (s: string) => Array.from(root.querySelectorAll(s)) as Array<HTMLElement & HTMLInputElement & HTMLSelectElement>;
    const fmt = (n: unknown) => "$" + (Number(n) || 0).toLocaleString("en-US");

    // Number of children dropdown
    const numKids = $("#numKids");
    numKids.innerHTML =
      '<option value="">Select…</option>' +
      Array.from({ length: 16 }, (_, i) => `<option value="${i}">${i}</option>`).join("");

    const ages = ["Under 1"].concat(Array.from({ length: 30 }, (_, i) => String(i + 1)));

    type Kid = { name?: string; gender?: string; age?: string; school?: string };
    const attr = (s: string) => s.replace(/"/g, "&quot;");

    function kidCard(i: number, prev: Kid) {
      const opt = (list: string[], sel?: string) =>
        '<option value="">Select…</option>' + list.map((v) => `<option${v === sel ? " selected" : ""}>${v}</option>`).join("");
      return `<div class="child" data-kid="${i}">
      <h4>Child ${i + 1}</h4>
      <div class="grid">
        <div><label class="req">First name</label><input type="text" data-f="name" value="${attr(prev.name || "")}" required></div>
        <div><label class="req">Boy or girl</label><select data-f="gender" required>${opt(["Boy", "Girl"], prev.gender)}</select></div>
        <div><label class="req">Age</label><select data-f="age" required>${opt(ages, prev.age)}</select></div>
        <div class="school-wrap"><label>School / yeshiva</label><input type="text" data-f="school" value="${attr(prev.school || "")}" placeholder="Name of school"></div>
      </div>
    </div>`;
    }
    function readKids(): Kid[] {
      return $$("#kids .child").map((c) => {
        const o: Record<string, string> = {};
        c.querySelectorAll<HTMLInputElement>("[data-f]").forEach((el) => (o[el.dataset.f as string] = el.value.trim()));
        return o;
      });
    }
    numKids.addEventListener("change", () => {
      const prev = readKids();
      const n = Number(numKids.value) || 0;
      $("#kids").innerHTML = Array.from({ length: n }, (_, i) => kidCard(i, prev[i] || {})).join("");
    });

    // Employment toggles
    function wireJob(prefix: string) {
      const radios = $$(`input[name=${prefix}Employed]`);
      const sync = () => {
        const yes = radios.find((r) => r.checked)?.value === "Yes";
        ($(`#${prefix}Position`) as HTMLInputElement).required = yes;
        $(`label[for=${prefix}Position]`).classList.toggle("req", yes);
      };
      radios.forEach((r) => r.addEventListener("change", sync));
      sync();
    }
    wireJob("h");
    wireJob("w");

    const updCombined = () => {
      $("#combined").textContent = fmt((+$("#hYearly").value || 0) + (+$("#wYearly").value || 0));
    };
    $("#hYearly").addEventListener("input", updCombined);
    $("#wYearly").addEventListener("input", updCombined);

    const syncAssist = () =>
      $("#assistList").classList.toggle("hidden", $("input[name=otherAssist]:checked")?.value !== "Yes");
    $$("input[name=otherAssist]").forEach((r) => r.addEventListener("change", syncAssist));
    syncAssist();
    $$("input[name=snap]").forEach((r) =>
      r.addEventListener("change", () => {
        $("#snapAmtWrap").classList.toggle("hidden", $("input[name=snap]:checked")?.value !== "Yes");
      })
    );
    $("#snapAmtWrap").classList.add("hidden");

    // Validation
    const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    function validate() {
      $$(".invalid").forEach((el) => el.classList.remove("invalid"));
      $$(".err-msg").forEach((el) => el.remove());
      let first: HTMLElement | null = null;
      let count = 0;
      const flag = (el: HTMLElement, msg: string) => {
        el.classList.add("invalid");
        count++;
        const m = document.createElement("div");
        m.className = "err-msg";
        m.textContent = msg;
        el.closest("div")?.appendChild(m);
        if (!first) first = el;
      };
      $$("#app [required]").forEach((el) => {
        if (el.offsetParent === null) return;
        if (!el.value.trim()) flag(el, "Required");
        else if ((el.getAttribute("type") === "email") && !emailOk(el.value)) flag(el, "Enter a valid email");
      });
      const sp = $("#spEmail");
      if (sp.value.trim() && !emailOk(sp.value)) flag(sp, "Enter a valid email");
      $$("[data-req-radio]").forEach((g) => {
        if (g.offsetParent === null) return;
        if (!g.querySelector("input:checked")) flag(g, "Please choose one");
      });
      const re = $("#rabbiEmail");
      if (re.value.trim() && !emailOk(re.value)) flag(re, "Enter a valid email");
      const top = $("#topErr");
      if (count) {
        top.textContent = `Please complete the ${count} highlighted item${count > 1 ? "s" : ""}.`;
        top.classList.remove("hidden");
        (first as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      top.classList.add("hidden");
      return true;
    }

    // Collect answers
    function collect() {
      const v = (id: string) => $("#" + id).value.trim();
      const radio = (n: string) => $(`input[name=${n}]:checked`)?.value || "";
      const job = (p: string): string[][] => {
        const rows = [["Currently employed", radio(p + "Employed") || "—"]];
        rows.push(["Occupation", v(p + "Position") || "—"]);
        rows.push(["Yearly earnings", fmt(v(p + "Yearly"))]);
        return rows;
      };
      const assistChecked = $$("input[name=assist]:checked").map((c) => c.value);
      const assist =
        radio("otherAssist") === "Yes"
          ? [...assistChecked, v("assistOther")].filter(Boolean).join(", ") || "Yes (not specified)"
          : "No";
      const kids = readKids();
      const consent = $("#smsConsent").checked;
      const groups: Array<[string, string[][]]> = [
        ["Status", [["Application", radio("status")]]],
        ["Applicant", [["Name", v("firstName") + " " + v("lastName")], ["Email", v("email")], ["Phone", v("phone")]]],
        ["Spouse", [["Name", (v("spFirst") + " " + v("spLast")).trim() || "—"], ["Email", v("spEmail") || "—"], ["Phone", v("spPhone") || "—"]]],
        ["Address", [["Address", [v("street"), v("apt")].filter(Boolean).join(", ") + ", " + v("city") + ", " + v("state").toUpperCase() + " " + v("zip")]]],
        ["Applicant — employment", job("h")],
        ["Spouse — employment", job("w")],
        ["Household income", [["Combined yearly earnings", fmt((+v("hYearly") || 0) + (+v("wYearly") || 0))]]],
        ["Government assistance", [["Food stamps (SNAP)", radio("snap") === "Yes" ? "Yes — " + fmt(v("snapAmt")) + " per month" : radio("snap")], ["Other assistance", assist]]],
        ["Rent or mortgage", [["Monthly rent or mortgage", fmt(v("housingCost"))]]],
        ["Shul", [["Shul", v("shul")], ["Rabbi", v("rabbi")], ["Rabbi phone", v("rabbiPhone")], ["Rabbi email", v("rabbiEmail") || "—"]]],
      ];
      const kidRows: string[][] = [["Number of children", String(kids.length)]];
      kids.forEach((k, i) => kidRows.push([`Child ${i + 1}`, `${k.name} — ${k.gender}, age ${k.age}${k.school ? ", " + k.school : ""}`]));
      groups.splice(9, 0, ["Children", kidRows]);
      groups.push(["Anything you’d like to add", [["Notes", v("notes") || "—"]]]);
      groups.push(["Text messages", [["Agreed to text messages", consent ? "Yes (box checked)" : "No"]]]);

      // Structured copy of the answers: the server checks the required ones and
      // the sheet log reads from it.
      const fields = {
        status: radio("status"),
        firstName: v("firstName"), lastName: v("lastName"), email: v("email"), phone: v("phone"),
        spFirst: v("spFirst"), spLast: v("spLast"), spEmail: v("spEmail"), spPhone: v("spPhone"),
        street: v("street"), apt: v("apt"), city: v("city"), state: v("state").toUpperCase(), zip: v("zip"),
        hEmployed: radio("hEmployed"), hPosition: v("hPosition"), hYearly: v("hYearly"),
        wEmployed: radio("wEmployed"), wPosition: v("wPosition"), wYearly: v("wYearly"),
        snap: radio("snap"), snapAmt: v("snapAmt"),
        otherAssist: radio("otherAssist"), assist: assistChecked, assistOther: v("assistOther"),
        housingCost: v("housingCost"), numKids: v("numKids"), kids,
        shul: v("shul"), rabbi: v("rabbi"), rabbiPhone: v("rabbiPhone"), rabbiEmail: v("rabbiEmail"),
        notes: v("notes"), smsConsent: consent,
      };
      return { groups, fields };
    }

    const esc = (s: unknown) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    let lastCollected: ReturnType<typeof collect> | null = null;

    $("#app").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      const collected = collect();
      lastCollected = collected;
      $("#sendErr").classList.add("hidden");
      $("#review").innerHTML =
        '<h2 style="font-family:Fraunces,Georgia,serif;font-weight:500;margin:0">Application summary</h2>' +
        collected.groups
          .map(([t, rows]) => `<h3>${esc(t)}</h3><table>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table>`)
          .join("");
      $("#app").classList.add("hidden");
      $("#reviewWrap").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("#editBtn").addEventListener("click", () => {
      $("#reviewWrap").classList.add("hidden");
      $("#app").classList.remove("hidden");
      window.scrollTo({ top: 0 });
    });
    $("#submitBtn").addEventListener("click", async (e) => {
      const btn = e.target as HTMLButtonElement;
      const err = $("#sendErr");
      if (!lastCollected) return;
      btn.disabled = true;
      btn.textContent = "Sending…";
      err.classList.add("hidden");
      try {
        const res = await fetch("/api/apply-assistance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lastCollected),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong.");
        $("#reviewWrap").classList.add("hidden");
        $("#doneWrap").classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (ex) {
        err.textContent =
          ex instanceof Error && ex.message && ex.message !== "Failed to fetch"
            ? ex.message
            : "Something went wrong sending your application. Please check your internet connection and try again.";
        err.classList.remove("hidden");
      }
      btn.disabled = false;
      btn.textContent = "Submit application";
    });
    // Two-click clear (no confirm dialogs allowed)
    let armed = false;
    $("#resetBtn").addEventListener("click", (e) => {
      const btn = e.target as HTMLButtonElement;
      if (!armed) {
        armed = true;
        btn.textContent = "Click again to clear";
        setTimeout(() => {
          armed = false;
          btn.textContent = "Clear form";
        }, 3000);
        return;
      }
      (root.querySelector("#app") as HTMLFormElement).reset();
      $("#kids").innerHTML = "";
      $$("#assistList,#snapAmtWrap").forEach((el) => el.classList.add("hidden"));
      updCombined();
      armed = false;
      btn.textContent = "Clear form";
      window.scrollTo({ top: 0 });
    });
  }, []);

  return (
    <main className="pt-20">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <div ref={rootRef} className="fa" dangerouslySetInnerHTML={{ __html: FORM_HTML }} />
    </main>
  );
}
