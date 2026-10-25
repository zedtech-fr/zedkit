import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("home shows scenarios and reaches a doc page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "zedkit", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start from your situation" })).toBeVisible();
  const scenarioLink = page.getByRole("link", { name: "Open the doc page" }).first();
  await expect(scenarioLink).toBeVisible();
  await scenarioLink.click();
  await page.waitForURL("**/docs/**", { timeout: 10000 });
  expect(errors).toEqual([]);
});

test("home search opens from the header", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
});

test("home keyboard: tab reaches scenario CTA", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  let found = false;
  for (let i = 0; i < 40; i++) {
    const active = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (active.includes("Open the doc page")) {
      found = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(found).toBe(true);
});

test.describe("persona evidence screenshots", () => {
  test("capture desktop and mobile home", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.screenshot({ path: "test-results/home-desktop-light.png", fullPage: true });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.screenshot({ path: "test-results/home-desktop-dark.png", fullPage: true });
    await page.emulateMedia({ colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/home-mobile-light.png", fullPage: true });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
