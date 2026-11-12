import { expect, test, type Page } from "@playwright/test";

import { catalogIndex } from "../content/catalog-index";

const MOBILE = { width: 390, height: 844 };

async function gotoCatalogQuiet(page: Page, path = "/catalog") {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  return errors;
}

function areaCount(area: (typeof catalogIndex)[number]["area"]) {
  return catalogIndex.filter((entry) => entry.area === area).length;
}

function chipName(label: string, area: (typeof catalogIndex)[number]["area"]) {
  return new RegExp(`^${label} · ${areaCount(area)}$`);
}

async function resultLinkGeometry(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector("[data-catalog-results]");
    const links = [...(root?.querySelectorAll("a:not([data-badge-link])") ?? [])];
    return links.map((a) => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent?.trim() ?? "", left: Math.round(r.left), top: Math.round(r.top) };
    });
  });
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
  expect(columnBox!.width).toBeLessThanOrEqual(1200);
  await page.waitForFunction(() => document.querySelector("[data-catalog-toolbar]"));
  await expect(page.locator("[data-catalog-toolbar]")).toBeVisible();
  const resultsWide = page
    .locator("main [data-slot='container'].max-w-wide")
    .filter({ has: page.locator("[data-catalog-results-root]") });
  await expect(resultsWide).toBeVisible();
  const resultsBox = await resultsWide.boundingBox();
  expect(resultsBox!.width).toBeLessThanOrEqual(1200);
  expect(Math.abs(resultsBox!.width - columnBox!.width)).toBeLessThan(8);
});

test("catalog runs wide with three row-major columns at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await gotoCatalogQuiet(page);
  await expect(page.locator("[data-catalog-results]")).toBeVisible();
  const container = await page
    .locator("main [data-slot='container'].max-w-wide")
    .filter({ has: page.locator("[data-catalog-results-root]") })
    .boundingBox();
  expect(container).not.toBeNull();
  expect(container!.width).toBeGreaterThanOrEqual(1150);
  expect(container!.width).toBeLessThanOrEqual(1200);
  const links = await resultLinkGeometry(page);
  expect(links.length).toBeGreaterThan(20);
  const lefts = [...new Set(links.map((l) => l.left))].sort((a, b) => a - b);
  expect(lefts).toHaveLength(3);
  const firstRow = links.slice(0, 3);
  expect(firstRow.map((l) => l.left)).toEqual(lefts);
  expect(Math.abs(firstRow[0]!.top - firstRow[1]!.top)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstRow[0]!.top - firstRow[2]!.top)).toBeLessThanOrEqual(2);
  expect(firstRow.map((l) => l.text)).toEqual(
    catalogIndex.filter((entry) => entry.area === "ui").slice(0, 3).map((entry) => entry.title),
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("catalog is one column at 390 and three from xl", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoCatalogQuiet(page);
  await expect(page.locator("[data-catalog-results]")).toBeVisible();
  const phone = [...new Set((await resultLinkGeometry(page)).map((l) => l.left))];
  expect(phone).toHaveLength(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1279, height: 1000 });
  const below = [...new Set((await resultLinkGeometry(page)).map((l) => l.left))];
  expect(below).toHaveLength(1);
  await page.setViewportSize({ width: 1280, height: 1000 });
  const above = [...new Set((await resultLinkGeometry(page)).map((l) => l.left))];
  expect(above).toHaveLength(3);
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

test("catalog category chips show live counts and have no area icons", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const ui = page.getByRole("button", { name: chipName("UI", "ui") });
  const core = page.getByRole("button", { name: chipName("Core and server", "backend") });
  const seo = page.getByRole("button", { name: chipName("SEO", "seo") });
  const agents = page.getByRole("button", { name: chipName("Agents", "agents") });
  await expect(page.getByRole("group", { name: "Catalog filters" })).toBeVisible();
  const category = page.getByRole("group", { name: "Category" });
  await expect(category).toBeVisible();
  await expect(ui).toBeVisible();
  await expect(ui).toHaveAttribute("aria-pressed", "true");
  await expect(core).toBeVisible();
  await expect(seo).toBeVisible();
  await expect(agents).toBeVisible();
  await expect(ui.locator("svg")).toHaveCount(0);
  const chipSize = await ui.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  expect(chipSize).toBeGreaterThanOrEqual(13);
  await expect(page.getByRole("checkbox", { name: "Stable only" })).toBeVisible();
  await expect(category.getByRole("checkbox", { name: "Stable only" })).toHaveCount(0);
  await expect(page.locator("[data-catalog-area]")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("Stable only visible label toggles the checkbox", async ({ page }) => {
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const checkbox = page.getByRole("checkbox", { name: "Stable only" });
  await expect(checkbox).not.toBeChecked();
  await page.locator('label[for="catalog-stable-only"]').click();
  await expect(checkbox).toBeChecked();
  await expect(page).toHaveURL(/status=stable/);
});

test("catalog area chip filters the grid and a second press clears it", async ({ page }) => {
  await page.goto("/catalog?area=seo", { waitUntil: "networkidle" });
  const seoChip = page.getByRole("button", { name: chipName("SEO", "seo") });
  await expect(seoChip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /^UI · /, level: 2 })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Jump to category" })).toHaveCount(0);
  const titles = await page.locator("[data-catalog-results] a:not([data-badge-link])").allTextContents();
  expect(titles).toEqual(catalogIndex.filter((entry) => entry.area === "seo").map((entry) => entry.title));
  await seoChip.click();
  await expect(page).toHaveURL(/area=all/);
  await expect(seoChip).toHaveAttribute("aria-pressed", "false");
});

test("catalog result maturity chips keep a decorative icon", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const badges = page.locator("a[data-badge-link]");
  const badgeCount = await badges.count();
  const expectedBadges = catalogIndex.filter(
    (entry) => entry.area === "ui" && entry.status.toLowerCase() !== "stable",
  ).length;
  expect(badgeCount).toBe(expectedBadges);
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
      localStorage.setItem("zk-docs-site-identity", "mist");
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
      localStorage.setItem("theme", "light");
    });
    await page.goto("/catalog", { waitUntil: "networkidle" });
    const results = page.locator("[data-catalog-results]");
    await expect(page.getByRole("status").filter({ hasText: /^Showing \d+ of \d+\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: chipName("UI", "ui") })).toBeVisible();
    await expect(results.locator("a:not([data-badge-link])").first()).toBeInViewport();
    await results.screenshot({ path: "test-results/catalog-grouped-mobile-390.png" });
  });
});

test.describe("catalog result maturity chips light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/catalog", { waitUntil: "networkidle" });
      const badge = page.locator("a[data-badge-link]").first();
      await badge.scrollIntoViewIfNeeded();
      await expect(badge).toBeVisible();
      await badge.locator("xpath=..").screenshot({
        path: `test-results/catalog-row-maturity-${mode}.png`,
      });
    });
  }
});

test("catalog search keeps every letter while typing", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search the catalog" });
  await search.click();
  await search.pressSequentially("dialog", { delay: 20 });
  await expect(search).toHaveValue("dialog");
  await expect(page).toHaveURL(/q=dialog/, { timeout: 5000 });
});

test("catalog filters persist in the URL and show empty state", async ({ page }) => {
  await page.goto("/catalog", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  const uiChip = page.getByRole("button", { name: chipName("UI", "ui") });
  await expect(uiChip).toHaveAttribute("aria-pressed", "true");
  await uiChip.click();
  await expect(page).toHaveURL(/area=all/);
  await expect(uiChip).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: chipName("SEO", "seo") }).click();
  await expect(page).toHaveURL(/area=seo/);
  await page.getByRole("searchbox", { name: "Search the catalog" }).fill("zzzz-no-match-zzzz");
  await expect(page).toHaveURL(/q=zzzz/);
  await expect(page.getByText("No catalog entries match")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/catalog\/?$/);
  await expect(page.getByRole("button", { name: chipName("UI", "ui") })).toHaveAttribute("aria-pressed", "true");
});

async function visibleResultLinks(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector("[data-catalog-results-root]");
    if (!root) return 0;
    const vh = window.innerHeight;
    return [...root.querySelectorAll("a:not([data-badge-link])")].filter((a) => {
      const r = a.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= vh && r.height > 0;
    }).length;
  });
}

test("catalog first viewport shows several result rows at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoCatalogQuiet(page);
  await expect(page.locator("[data-catalog-results]")).toBeVisible();
  const visible = await visibleResultLinks(page);
  expect(visible).toBeGreaterThanOrEqual(9);
});

test("catalog desktop header has docs search and GitHub text, no version or theme", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoCatalogQuiet(page);
  const header = page.locator("#nd-nav");
  await expect(
    header.locator('[data-search], [aria-label="Search documentation"]').filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(header.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toBeVisible();
  await expect(header.locator("[data-theme-toggle]").filter({ visible: true })).toHaveCount(0);
  await expect(header.locator("[data-kit-version]")).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Get started", exact: true })).toHaveCount(0);
});

test("catalog title is 40px at 1440 and 390", async ({ page }) => {
  for (const size of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ] as const) {
    await page.setViewportSize(size);
    await gotoCatalogQuiet(page);
    const fontSize = await page.getByRole("heading", { name: "Catalog", level: 1 }).evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize, `${size.width}px`).toBeGreaterThanOrEqual(39);
    expect(fontSize, `${size.width}px`).toBeLessThanOrEqual(41);
  }
});

test("catalog first viewport shows result rows at 390", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await gotoCatalogQuiet(page);
  await expect(page.locator("[data-catalog-results]")).toBeVisible();
  const visible = await visibleResultLinks(page);
  expect(visible).toBeGreaterThanOrEqual(2);
});

test("catalog filter chips use quiet fill not primary accent", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalog?area=ui", { waitUntil: "networkidle" });
  const chip = page.getByRole("button", { name: chipName("UI", "ui") });
  await expect(chip).toBeVisible();
  const usesPrimaryBg = await chip.evaluate((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    const probe = document.createElement("div");
    probe.style.backgroundColor = "hsl(var(--primary) / 1)";
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);
    const primaryBg = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return bg === primaryBg;
  });
  expect(usesPrimaryBg).toBe(false);
});

test("home links to catalog from the site header (#118)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const catalog = page.getByRole("link", { name: "Catalog", exact: true }).first();
  await expect(catalog).toBeVisible();
  await expect(catalog).toHaveAttribute("href", "/catalog");
  await expect(page.locator("#components, [data-home-component-families]")).toHaveCount(0);
});

test("catalog link in the header stays visible at phone width", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/", { waitUntil: "networkidle" });
  const catalog = page.getByRole("link", { name: "Catalog", exact: true }).first();
  await catalog.scrollIntoViewIfNeeded();
  await expect(catalog).toBeVisible();
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
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const catalog = page.getByRole("link", { name: "Catalog", exact: true }).first();
      await catalog.scrollIntoViewIfNeeded();
      await expect(catalog).toBeVisible();
      await catalog.screenshot({ path: `test-results/home-catalog-cta-${mode}.png` });
    });
  }
});
