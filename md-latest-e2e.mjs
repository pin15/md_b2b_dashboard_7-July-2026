import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const EXEC =
  process.env.HOME +
  "/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const OUT = "/Users/a/Desktop/MD_June_2026/b2b-local-dev";
const EMAIL = readFileSync("/tmp/patient_email.txt", "utf8").trim();
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
page.on("console", (m) => { if (m.type() === "error") console.log("  [page err]", m.text().slice(0, 160)); });
try {
  console.log("→ md-latest /login as", EMAIL);
  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill('input[type="password"]', "Local1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  console.log("  logged in →", page.url());
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/md-latest-dashboard.png`, fullPage: true });
  console.log("  ✓ md-latest-dashboard.png");
} catch (e) {
  console.log("ERR:", e.message, "| at", page.url());
  await page.screenshot({ path: `${OUT}/md-latest-error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
