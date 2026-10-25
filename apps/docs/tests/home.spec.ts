import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("home explains the product and four entry areas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", {
      name: "Build the parts you need. Keep the rest of your app.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose an area" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open UI docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open backend docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SEO docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open agent setup docs" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("entry point CTAs open catalog or guide pages (not folder 404s)", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const entry = page.getByRole("link", { name: "Open UI docs" });
  await entry.click();
  await page.waitForURL("**/docs/ui/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home scenario links have unique accessible names", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const scenarioLink = page.getByRole("link", { name: "Read docs: New admin UI in an existing app" });
  await expect(scenarioLink).toBeVisible();
  await scenarioLink.click();
  await page.waitForURL("**/docs/**", { timeout: 10000 });
});

test("home has no nested interactive elements", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const nested = await page.evaluate(() => {
    const bad: string[] = [];
    for (const anchor of document.querySelectorAll("a")) {
      if (anchor.querySelector("button")) bad.push(`anchor>button: ${anchor.textContent?.trim()}`);
    }
    for (const button of document.querySelectorAll("button")) {
      const parentAnchor = button.closest("a");
      if (parentAnchor && parentAnchor.querySelector("button") === button) {
        bad.push(`button inside anchor: ${button.textContent?.trim()}`);
      }
    }
    return bad;
  });
  expect(nested).toEqual([]);
});

test("home UI quickstart lists prerequisites before install copy", async ({ page }) => {
  await page.goto(`${BASE}#quickstart`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Prerequisites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2. Install the package" })).toBeVisible();
  const order = await page.evaluate(() => {
    const headings = [...document.querySelectorAll("h3")].map((el) => el.textContent?.trim() ?? "");
    const pre = headings.findIndex((t) => t === "Prerequisites");
    const install = headings.findIndex((t) => t.startsWith("2. Install"));
    return { pre, install };
  });
  expect(order.pre).toBeGreaterThanOrEqual(0);
  expect(order.install).toBeGreaterThan(order.pre);
  await expect(page.getByLabel("Copy globals.css")).toBeVisible();
  await expect(page.getByLabel("Copy pnpm command")).toBeVisible();
  await expect(page.getByLabel("Copy page.tsx")).toBeVisible();
});

test("home search opens from the header", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
});

test("home keyboard: tab reaches an entry-point CTA", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  let found = false;
  for (let i = 0; i < 50; i++) {
    const active = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (active.includes("Open UI docs")) {
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
