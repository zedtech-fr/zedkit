import { expect, test } from "@playwright/test";
import { registryBrickNames } from "../content/registry-site";

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
  await expect(page.getByRole("link", { name: "Open core & server docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SEO docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open agent setup docs" })).toBeVisible();
  await expect(page.locator("#entry-points svg[aria-hidden='true']")).toHaveCount(8);
  expect(errors).toEqual([]);
});

test("home area cards keep a decorative icon at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const section = page.locator("#entry-points");
  await expect(section.getByText("Build a UI", { exact: true })).toBeVisible();
  await expect(section.locator("svg[aria-hidden='true']")).toHaveCount(8);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("entry point CTAs open catalog or guide pages (not folder 404s)", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const entry = page.getByRole("link", { name: "Open UI docs" });
  await entry.click();
  await page.waitForURL("**/docs/ui/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home gallery maturity badges keep a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const badges = page.locator("#components a[data-badge-link]");
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);
  await expect(badges.locator("svg[aria-hidden='true']")).toHaveCount(count);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home gallery maturity badges light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const section = page.locator("#components");
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator("a[data-badge-link]").first()).toBeVisible();
      await section.screenshot({ path: `test-results/home-maturity-gallery-${mode}.png` });
    });
  }
});

test("home scenario titles keep a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const titles = page.locator("#scenarios [data-slot='card-title']");
  await expect(titles).toHaveCount(6);
  await expect(titles.locator("svg[aria-hidden='true']")).toHaveCount(6);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home scenario titles light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const scenarios = page.locator("#scenarios");
      await scenarios.scrollIntoViewIfNeeded();
      await expect(scenarios.getByText("New admin UI in an existing app", { exact: true })).toBeVisible();
      await scenarios.screenshot({ path: `test-results/home-scenario-titles-${mode}.png` });
    });
  }
});

test("home docs CTAs keep a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  for (const name of [
    "Open UI docs",
    "Open core & server docs",
    "Open SEO docs",
    "Open agent setup docs",
  ] as const) {
    await expect(page.getByRole("link", { name }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const scenarios = page.locator("#scenarios");
  await expect(scenarios.getByRole("link").locator("svg[aria-hidden='true']")).toHaveCount(6);
  await expect(page.locator("#install-or-copy [data-docs-ctas] svg[aria-hidden='true']")).toHaveCount(2);
  await expect(page.locator("#ai-setup [data-docs-ctas] svg[aria-hidden='true']")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open documentation" }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Theme setup page" }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "axe test suite" }).locator("svg")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home docs CTAs light/dark (#748)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const entry = page.locator("#entry-points");
      const scenarios = page.locator("#scenarios");
      await entry.scrollIntoViewIfNeeded();
      await expect(entry.getByRole("link", { name: "Open UI docs" })).toBeVisible();
      await entry.screenshot({ path: `test-results/home-cta-entry-${mode}.png` });
      await scenarios.scrollIntoViewIfNeeded();
      await expect(scenarios.getByRole("link", { name: "Read the docs: New admin UI in an existing app" })).toBeVisible();
      await scenarios.screenshot({ path: `test-results/home-cta-scenarios-${mode}.png` });
    });
  }
});

test.describe("home section docs CTAs light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const install = page.locator("#install-or-copy [data-docs-ctas]");
      const ai = page.locator("#ai-setup [data-docs-ctas]");
      await install.scrollIntoViewIfNeeded();
      await expect(install.getByRole("link", { name: "Getting started" })).toBeVisible();
      await install.screenshot({ path: `test-results/home-section-cta-install-${mode}.png` });
      await ai.scrollIntoViewIfNeeded();
      await expect(ai.getByRole("link", { name: "AI setup docs" })).toBeVisible();
      await ai.screenshot({ path: `test-results/home-section-cta-ai-${mode}.png` });
    });
  }
});

test.describe("home hero and proofs docs CTAs light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const hero = page.getByRole("link", { name: "Open documentation" });
      const theme = page.getByRole("link", { name: "Theme setup page" });
      await hero.scrollIntoViewIfNeeded();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/home-hero-docs-cta-${mode}.png` });
      await theme.scrollIntoViewIfNeeded();
      await expect(theme).toBeVisible();
      await theme.screenshot({ path: `test-results/home-proofs-theme-cta-${mode}.png` });
    });
  }
});

test("home scenario links have unique accessible names", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const scenarioLink = page.getByRole("link", { name: "Read the docs: New admin UI in an existing app" });
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

test("quickstart brick names keep a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#quickstart`, { waitUntil: "networkidle" });
  const list = page.locator("#quickstart [data-registry-bricks]");
  await expect(list.locator("[data-registry-brick]")).toHaveCount(registryBrickNames.length);
  await expect(list.locator("svg[aria-hidden='true']")).toHaveCount(registryBrickNames.length);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("quickstart brick list light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(`${BASE}#quickstart`, { waitUntil: "networkidle" });
      const list = page.locator("#quickstart [data-registry-bricks]");
      await list.scrollIntoViewIfNeeded();
      await expect(list.getByText("badge", { exact: true })).toBeVisible();
      await list.screenshot({ path: `test-results/quickstart-brick-list-${mode}.png` });
    });
  }
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
