// Server-side check for the Cloudflare Turnstile widget on the donation
// forms — added 2026-09-23 after MerchPay flagged fraudulent card attempts
// and required a CAPTCHA before they'd keep processing charges.
//
// The widget itself only proves a human loaded the page; the token it
// produces still has to be verified here, server-side, or a bot could skip
// the widget entirely and POST straight to the charge routes.
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  // Fails CLOSED if the secret isn't configured — a misconfigured server
  // should block charges, not silently skip the check MerchPay required.
  if (!secret) {
    console.error("Turnstile: TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  if (!token || typeof token !== "string") return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      cache: "no-store",
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
