import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const MOBILE = { width: 390, height: 844 };

async function gotoCatalogQuiet(page: Page, path = "/catalog") {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  return errors;
}

async function resultLinkGeometry(page: Page, groupId = "ui") {
  return page.evaluate((id) => {
    const group = document.querySelector(`[data-catalog-group="${id}"]`);
    const links = [...(group?.querySelectorAll("a:not([data-badge-link])") ?? [])];
    return links.map((a) => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent?.trim() ?? "", left: Math.round(r.left), top: Math.round(r.top) };
    });
  }, groupId);
}

test("catalog intro bleeds full width and the filters sit in a narrower column", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoCatalogQuiet(page);
  const intro = page.locator("[data-slot='section']").filter({
    has: page.getByRole("heading", { name: "Catalog", level: 1 }),
  });
  await expect(intro).toHaveClass(/bg-muted/);
  const introBox = await intro.boundingBox();
  const introColumn = intro.locator("[data-slot='container']");
  await expect(introColumn).toHaveClass(/max-w-default/);
  const columnBox = await introColumn.boundingBox();
  expect(introBox).not.toBeNull();
  expect(columnBox).not.toBeNull();
  expect(introBox!.width).toBeGreaterThan(columnBox!.width + 40);
  const results = page.locator("[data-slot='container']").filter({
    has: page.getByRole("heading", { name: "Results", level: 2 }),
  });
  await expect(results).toHaveClass(/max-w-wide/);
  const resultsBox = await results.boundingBox();
  expect(resultsBox!.width).toBeGreaterThan(columnBox!.width);
});

test("catalog runs wide with two alphabetical columns per group at 2560 (#1063)", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1080 });
  await gotoCatalogQuiet(page);
  await expect(page.locator('[data-catalog-group="ui"]').first()).toBeVisible();
  const container = await page
    .locator("main [data-slot='container']")
    .filter({ has: page.getByRole("heading", { name: "Results", level: 2 }) })
    .boundingBox();
  expect(container).not.toBeNull();
  expect(container!.width).toBeGreaterThanOrEqual(1400);
  const links = await resultLinkGeometry(page, "ui");
  expect(links.length).toBeGreaterThan(20);
  const lefts = [...new Set(links.map((l) => l.left))].sort((a, b) => a - b);
  expect(lefts).toHaveLength(2);
  const [leftCol, rightCol] = lefts.map((left) => links.filter((l) => l.left === left));
  expect(leftCol!.at(-1)!.text.localeCompare(rightCol![0]!.text)).toBeLessThan(0);
  expect(Math.abs(leftCol![0]!.top - rightCol![0]!.top)).toBeLessThanOrEqual(2);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("catalog steps from one column to two at the xl boundary (#1063)", async ({ page }) => {
  await page.setViewportSize({ width: 1279, height: 1000 });
  await gotoCatalogQuiet(page);
  await expect(page.locator('[data-catalog-group="ui"]').first()).toBeVisible();
  const below = [...new Set((await resultLinkGeometry(page, "ui")).map((l) => l.left))];
  expect(below).toHaveLength(1);
  await page.setViewportSize({ width: 1280, height: 1000 });
  const above = [...new Set((await resultLinkGeometry(page, "ui")).map((l) => l.left))];
  expect(above).toHaveLength(2);
});

test("catalog has no console errors on desktop", async ({ page }) => {
  const errors = await gotoCatalogQuiet(page);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog has no console errors on mobile", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = await gotoCatalogQuiet(page);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog has no console errors with a filter in the URL", async ({ page }) => {
  const errors = await gotoCatalogQuiet(page, "/catalog?area=ui");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog area filters keep a decorative icon", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  const areas = page.getByRole("group", { name: "Area" });
  await expect(areas.getByRole("button", { name: "All areas" }).locator("svg")).toHaveCount(0);
  for (const name of ["UI", "Core & server", "SEO", "Agents"] as const) {
    await expect(areas.getByRole("button", { name, exact: true }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("catalog results group by category without per-row area chips", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /^UI · \d+$/, level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Backend · \d+$/, level: 3 })).toBeVisible();
  await expect(page.locator("[data-catalog-area]")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("catalog area filter shows one category group", async ({ page }) => {
  await page.goto(`${BASE}/catalog?area=seo`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /^SEO · \d+$/, level: 3 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /^UI · /, level: 3 })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Jump to category" })).toHaveCount(0);
});

test("catalog result maturity chips keep a decorative icon", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  const badges = page.locator("a[data-badge-link]");
  const badgeCount = await badges.count();
  expect(badgeCount).toBe(47);
  await expect(badges.locator("svg[aria-hidden='true']")).toHaveCount(badgeCount);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("catalog grouped results mobile visual", () => {
  test("390px mist", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("zk-identity", "mist");
      localStorage.setItem("theme", "light");
    });
    await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
    const results = page.locator("[data-catalog-results]");
    await results.scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /^Results$/, level: 2 })).toBeVisible();
    await expect(page.getByRole("link", { name: /UI \(\d+\)/ })).toBeVisible();
    await results.screenshot({ path: "test-results/catalog-grouped-mobile-390.png" });
  });
});

test.describe("catalog result maturity chips light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
      const badge = page.locator("a[data-badge-link]").first();
      await badge.scrollIntoViewIfNeeded();
      await expect(badge).toBeVisible();
      await badge.locator("xpath=..").screenshot({
        path: `test-results/catalog-row-maturity-${mode}.png`,
      });
    });
  }
});

test("catalog filters persist in the URL and show empty state", async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "UI", exact: true }).click();
  await expect(page).toHaveURL(/area=ui/);
  await page.getByRole("searchbox", { name: "Catalog search" }).fill("zzzz-no-match-zzzz");
  await expect(page).toHaveURL(/q=zzzz/);
  await expect(page.getByText("No catalog entries match")).toBeVisible();
});

test("home links to catalog with curated grid", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const catalog = page.getByRole("link", { name: "Browse full catalog" });
  await expect(catalog).toBeVisible();
  await expect(catalog.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const count = await page.locator("#components .grid > *").count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(8);
});

test("catalog CTA keeps a decorative icon at phone width", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(BASE, { waitUntil: "networkidle" });
  const catalog = page.getByRole("link", { name: "Browse full catalog" });
  await expect(catalog.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("catalog CTA light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const catalog = page.getByRole("link", { name: "Browse full catalog" });
      await catalog.scrollIntoViewIfNeeded();
      await expect(catalog).toBeVisible();
      await catalog.screenshot({ path: `test-results/home-catalog-cta-${mode}.png` });
    });
  }
});
