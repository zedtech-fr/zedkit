import { expect, test, type Page } from "@playwright/test";

/** Phone tap target is 44px. Subpixel layout can measure 43.5. */
const TAP = 44;
const TAP_MEASURED = TAP - 0.5;
/** Page gutter and WCAG 2.5.8 minimum pointer size share 24px. */
const GUTTER = 24;
const SEARCH_NAME = "Search documentation";

const PAGES = ["/", "/catalog", "/docs/getting-started"];
const SEARCH_PAGES = ["/catalog", "/docs/getting-started"];
/** Same flex row: y can differ by a few px when heights differ. */
const ROW = 8;

async function pageOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function assertHashClearsPhoneHeader(page: Page, target: string) {
  const header = page.locator("#nd-mobile-nav");
  await expect(header).toBeVisible();
  const el = page.locator(target);
  await expect(el).toBeVisible();
  const headerBox = await header.boundingBox();
  const targetBox = await el.boundingBox();
  expect(targetBox?.y ?? 0).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0) - 1);
}

test("the phone header lists AI, UI, Docs, and Catalog with Catalog current", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog");
  const header = page.locator("#nd-mobile-nav");
  const current = header.getByRole("link", { name: "Catalog", exact: true });
  await expect(current).toBeVisible();
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toHaveCSS("text-decoration-line", "underline");
  await expect(header.getByRole("link", { name: "AI", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "UI", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Docs", exact: true })).toBeVisible();
  await expect(header.getByRole("listitem")).toHaveCount(4);
  await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  expect((await current.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(TAP);
  const brand = header.getByRole("link", { name: "zedkit home" });
  const ai = header.getByRole("link", { name: "AI", exact: true });
  const brandBox = await brand.boundingBox();
  const catalogBox = await current.boundingBox();
  const aiBox = await ai.boundingBox();
  expect(Math.abs((catalogBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
  expect(Math.abs((aiBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
  const searchBox = await header.getByRole("button", { name: SEARCH_NAME, exact: true }).boundingBox();
  expect(searchBox?.y ?? 0).toBeGreaterThan((brandBox?.y ?? 0) + (brandBox?.height ?? 0) / 2);
});

test("the docs phone bar keeps a painted fill without an 80% background class", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/getting-started");
  const header = page.locator("[data-docs-phone-bar]");
  await expect(header).toBeVisible();
  await expect(header).not.toHaveClass(/bg-background\/80/);
  const background = await header.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});

test("docs phone Open navigation opens the page tree", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/getting-started");
  await page.locator("#nd-mobile-nav").getByRole("button", { name: "Open navigation" }).click();
  const drawer = page
    .getByRole("dialog")
    .or(page.locator("#nd-sidebar"))
    .or(page.locator("#nd-sidebar-mobile"));
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Getting started" }).first()).toBeVisible();
  const background = await drawer.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});

test("phone #get-started and docs heading hashes clear the wrapped header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#get-started", { waitUntil: "networkidle" });
  await assertHashClearsPhoneHeader(page, "#get-started");
  await page.goto("/docs/getting-started#install-or-copy", { waitUntil: "networkidle" });
  await assertHashClearsPhoneHeader(page, "#install-or-copy");
});

test("360px phone header does not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
  await page.goto("/catalog");
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
  await page.goto("/docs/getting-started");
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
});

for (const path of PAGES) {
  test.describe(`phone header on ${path}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("name left, actions right, no overflow, 44px targets", async ({ page }) => {
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      await expect(header).toBeVisible();
      expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
      const home = header.getByRole("link", { name: "zedkit home" });
      await expect(home).toBeVisible();
      expect((await home.boundingBox())?.x ?? 99).toBeLessThanOrEqual(GUTTER);
      await expect(header.getByRole("link", { name: "AI", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: "UI", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: "Docs", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: "Catalog", exact: true })).toBeVisible();
      if (path === "/") {
        await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
        await expect(header.getByRole("button", { name: SEARCH_NAME, exact: true })).toHaveCount(0);
        await expect(header.getByRole("link", { name: "Get started", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "And yours?" })).toBeVisible();
      } else if (path === "/catalog") {
        await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
        await expect(header.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
        await expect(header.getByRole("link", { name: "Get started", exact: true })).toHaveCount(0);
        await expect(header.getByRole("button", { name: SEARCH_NAME, exact: true })).toBeVisible();
      } else {
        await expect(header.getByRole("button", { name: "Open navigation" })).toBeVisible();
        await expect(header.getByRole("button", { name: SEARCH_NAME, exact: true })).toBeVisible();
      }
      const brandBox = await home.boundingBox();
      const catalogBox = await header.getByRole("link", { name: "Catalog", exact: true }).boundingBox();
      const aiBox = await header.getByRole("link", { name: "AI", exact: true }).boundingBox();
      expect(Math.abs((catalogBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
      expect(Math.abs((aiBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
      const secondRow =
        path === "/"
          ? header.getByRole("link", { name: "Get started", exact: true })
          : header.getByRole("button", { name: SEARCH_NAME, exact: true });
      const secondBox = await secondRow.boundingBox();
      expect(secondBox?.y ?? 0).toBeGreaterThan((brandBox?.y ?? 0) + (brandBox?.height ?? 0) / 2);
      const headerBox = await header.boundingBox();
      expect(headerBox?.height ?? 0).toBeGreaterThanOrEqual(100);
      expect(headerBox?.height ?? 0).toBeLessThan(140);
      const primaryNav = new Set(["AI", "UI", "Docs", "Catalog"]);
      for (const control of await header.locator("a, button").filter({ visible: true }).all()) {
        const box = await control.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
        const label = ((await control.textContent()) ?? "").trim();
        if (primaryNav.has(label)) {
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(GUTTER);
        } else {
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
        }
      }
    });

    test("the home link shows the logo mark next to the name", async ({ page }) => {
      await page.goto(path);
      const home = page.locator("#nd-mobile-nav").getByRole("link", { name: "zedkit home" });
      const mark = home.locator("svg");
      await expect(mark).toHaveCount(1);
      await expect(mark).toBeVisible();
      await expect(mark).toHaveAttribute("aria-hidden", "true");
      await expect(home).toContainText("zedkit");
      const box = await mark.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(0);
      const name = home.getByText("zedkit", { exact: true });
      const markBox = await mark.boundingBox();
      const nameBox = await name.boundingBox();
      expect((nameBox?.x ?? 0) - ((markBox?.x ?? 0) + (markBox?.width ?? 0))).toBeGreaterThan(0);
    });
  });
}

for (const path of SEARCH_PAGES) {
  test.describe(`phone header search on ${path}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("search lives in the header and opens the dialog without a floating button", async ({ page }) => {
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      const headerSearch = header.getByRole("button", { name: SEARCH_NAME, exact: true });
      await expect(headerSearch).toBeVisible();
      const headerBox = await headerSearch.boundingBox();
      expect(headerBox?.height ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
      const brand = header.getByRole("link", { name: "zedkit home" });
      const brandBox = await brand.boundingBox();
      expect(headerBox?.y ?? 0).toBeGreaterThan((brandBox?.y ?? 0) + (brandBox?.height ?? 0) / 2);
      const searchBottom = (headerBox?.y ?? 0) + (headerBox?.height ?? 0);
      expect(searchBottom).toBeGreaterThanOrEqual(100);
      expect(searchBottom).toBeLessThan(140);
      const navBox = await header.boundingBox();
      expect(navBox?.height ?? 0).toBeGreaterThanOrEqual(100);
      expect(navBox?.height ?? 0).toBeLessThan(140);
      await expect(page.locator("[data-search-pill]")).toHaveCount(0);
      await headerSearch.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("input")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(headerSearch).toBeFocused();
    });
  });
}

test("desktop keeps the stock header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#nd-mobile-nav")).toBeHidden();
  await expect(page.locator("#nd-nav")).toBeVisible();
});

test("1440 Home and Catalog headers stay a single 3.5rem row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/", "/catalog"]) {
    await page.goto(path);
    await expect(page.locator("#nd-mobile-nav")).toBeHidden();
    const nav = page.locator("#nd-nav");
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(56 - 1);
    expect(box?.height ?? 0).toBeLessThan(70);
    const brand = nav.getByRole("link", { name: "zedkit home" });
    const catalog = nav.getByRole("link", { name: "Catalog", exact: true });
    const brandBox = await brand.boundingBox();
    const catalogBox = await catalog.boundingBox();
    expect(Math.abs((catalogBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
  }
});
