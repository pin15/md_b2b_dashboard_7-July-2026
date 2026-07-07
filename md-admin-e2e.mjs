import { chromium } from "playwright-core";
const EXEC =
  process.env.HOME +
  "/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const OUT = "/Users/a/Desktop/MD_June_2026/b2b-local-dev";
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("console", (m) => { if (m.type() === "error") console.log("  [page err]", m.text().slice(0, 160)); });
try {
  console.log("→ md-admin /auth/login");
  await page.goto("http://localhost:3002/auth/login", { waitUntil: "networkidle" });
  await page.fill("#email", "kc@admin.com");
  await page.fill("#password", "Local1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/**", { timeout: 30000 });
  console.log("  logged in →", page.url());
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/md-admin-dashboard.png`, fullPage: true });
  console.log("  ✓ md-admin-dashboard.png");
} catch (e) {
  console.log("ERR:", e.message, "| at", page.url());
  await page.screenshot({ path: `${OUT}/md-admin-error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
