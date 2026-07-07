// Drives the live local stack end-to-end: login → TOTP MFA → dashboard, and screenshots.
// Uses the cached Playwright Chromium (headless shell). Run from b2b-dashboard/.
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";

const EXEC =
  process.env.HOME +
  "/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = "http://localhost:3000";
const OUT = "/Users/a/Desktop/MD_June_2026/b2b-local-dev";

// ---- RFC 6238 TOTP from a base32 secret ----
function base32Decode(s) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase()) {
    const v = A.indexOf(c);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function totp(secret, t = Date.now()) {
  const key = base32Decode(secret);
  let counter = Math.floor(t / 1000 / 30);
  const buf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) { buf[i] = counter & 0xff; counter = Math.floor(counter / 256); }
  const h = createHmac("sha1", key).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
page.on("console", (m) => { if (m.type() === "error") console.log("  [page error]", m.text().slice(0, 200)); });

try {
  console.log("→ /login");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", process.env.E2E_EMAIL ?? "hr@acme.test");
  await page.fill("#password", process.env.E2E_PASSWORD ?? "Test1234!");
  await page.click('button[type="submit"]');

  console.log("→ waiting for MFA enroll");
  await page.waitForURL("**/mfa**", { timeout: 15000 });
  await page.waitForSelector("code", { timeout: 15000 });
  const secret = (await page.locator("code").first().textContent())?.trim() ?? "";
  console.log("  enrolled secret:", secret.slice(0, 8) + "…");

  const code = totp(secret);
  console.log("  TOTP:", code);
  await page.fill('input[inputmode="numeric"]', code);
  await page.click('button[type="submit"]');

  console.log("→ waiting for dashboard");
  await page.waitForURL("**/dashboard**", { timeout: 20000 });
  await page.waitForSelector("text=Wellness Score (OWI)", { timeout: 20000 });
  // Wait for the OWI gauge to actually render its numeric value (React Query settled),
  // not the loading/suppressed default.
  await page
    .waitForFunction(() => /\b\d{1,3}\b\s*\/\s*100/.test(document.body.innerText), { timeout: 15000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/dashboard-overview.png`, fullPage: true });
  console.log("  ✓ dashboard-overview.png");

  console.log("→ /participation");
  await page.goto(`${BASE}/participation`, { waitUntil: "networkidle" });
  await page.waitForSelector("table", { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/participation.png`, fullPage: true });
  console.log("  ✓ participation.png");

  // dump what the UI actually rendered for proof
  const owi = await page.evaluate(() => document.body.innerText.match(/Wellness Score[\s\S]{0,40}/)?.[0] ?? "");
  console.log("RESULT: reached AAL2 dashboard + participation; sample:", JSON.stringify(owi));
} catch (e) {
  console.log("E2E ERROR:", e.message);
  await page.screenshot({ path: `${OUT}/error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
