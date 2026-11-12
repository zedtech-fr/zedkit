import { expect, test, type Locator, type Page } from "@playwright/test";

/** Phone tap target is 44px. Subpixel layout can measure 43.5. */
const TAP = 44;
const TAP_MEASURED = TAP - 0.5;
/** Page gutter and WCAG 2.5.8 minimum pointer size share 24px. */
const GUTTER = 24;
const SEARCH_NAME = "Search documentation";
const MENU_NAME = "Menu";
const COMPACT_MAX = 64;

const PAGES = ["/", "/catalog", "/docs/getting-started", "/docs/foundations", "/issues"];
const SEARCH_PAGES = ["/catalog", "/docs/getting-started", "/docs/foundations", "/issues"];
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

async function openPhoneMenu(page: Page): Promise<{ menu: Locator; dialog: Locator }> {
  const menu = page.locator("#nd-mobile-nav").getByRole("button", { name: MENU_NAME, exact: true });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  return { menu, dialog };
}

test("the phone header lists AI, UI, Docs, and Catalog with Catalog current", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog");
  const header = page.locator("#nd-mobile-nav");
  await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Catalog", exact: true })).toHaveCount(0);
  const { dialog } = await openPhoneMenu(page);
  const current = dialog.getByRole("link", { name: "Catalog", exact: true });
  await expect(current).toBeVisible();
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toHaveCSS("text-decoration-line", "underline");
  await expect(dialog.getByRole("link", { name: "AI", exact: true })).toHaveAttribute("href", "/docs/ai/setup");
  await expect(dialog.getByRole("link", { name: "UI", exact: true })).toHaveAttribute("href", "/docs/foundations");
  await expect(dialog.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
  await expect(dialog.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toBeVisible();
  await expect(dialog.getByRole("listitem")).toHaveCount(5);
  expect((await current.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(TAP);
  const brand = header.getByRole("link", { name: "zedkit home" });
  const searchBox = await header.getByRole("button", { name: SEARCH_NAME, exact: true }).boundingBox();
  const brandBox = await brand.boundingBox();
  expect(Math.abs((searchBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
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

test("docs phone page tree is in the page without Open navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/getting-started");
  await expect(page.locator("#nd-mobile-nav").getByRole("button", { name: "Open navigation" })).toHaveCount(0);
  const tree = page.locator("#nd-sidebar");
  const title = page.getByRole("heading", { name: "Getting started", level: 1 });
  await expect(tree).toBeVisible();
  await expect(tree.getByRole("link", { name: "Getting started" }).first()).toBeVisible();
  expect((await tree.boundingBox())!.y).toBeLessThan((await title.boundingBox())!.y);
  const background = await tree.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});

test("phone #get-started and docs heading hashes clear the compact header", async ({ page }) => {
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
      const menu = header.getByRole("button", { name: MENU_NAME, exact: true });
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
      await expect(header.getByRole("link", { name: "AI", exact: true })).toHaveCount(0);
      if (path === "/") {
        await expect(header.getByRole("button", { name: SEARCH_NAME, exact: true })).toHaveCount(0);
        await expect(header.getByRole("link", { name: "Get started", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "And yours?" })).toBeVisible();
      } else {
        await expect(header.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
        await expect(header.getByRole("link", { name: "Get started", exact: true })).toHaveCount(0);
        await expect(header.getByRole("button", { name: SEARCH_NAME, exact: true })).toBeVisible();
      }
      const brandBox = await home.boundingBox();
      const action =
        path === "/"
          ? header.getByRole("link", { name: "Get started", exact: true })
          : header.getByRole("button", { name: SEARCH_NAME, exact: true });
      const actionBox = await action.boundingBox();
      const menuBox = await menu.boundingBox();
      expect(Math.abs((actionBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
      expect(Math.abs((menuBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
      const headerBox = await header.boundingBox();
      expect(headerBox?.height ?? 0).toBeGreaterThanOrEqual(56 - 1);
      expect(headerBox?.height ?? 0).toBeLessThanOrEqual(COMPACT_MAX);
      for (const control of await header.locator("a, button").filter({ visible: true }).all()) {
        const box = await control.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
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

    test("Menu opens site links and Escape returns focus", async ({ page }) => {
      await page.goto(path);
      const { menu, dialog } = await openPhoneMenu(page);
      await expect(dialog.getByRole("link", { name: "AI", exact: true })).toHaveAttribute("href", "/docs/ai/setup");
      await expect(dialog.getByRole("link", { name: "UI", exact: true })).toHaveAttribute("href", "/docs/foundations");
      await expect(dialog.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
      await expect(dialog.getByRole("link", { name: "Catalog", exact: true })).toHaveAttribute("href", "/catalog");
      await expect(dialog.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toHaveAttribute(
        "href",
        "https://github.com/zedtech-fr/zedkit",
      );
      for (const control of await dialog.locator("a, button").filter({ visible: true }).all()) {
        const box = await control.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(TAP_MEASURED);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(menu).toBeFocused();
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
      expect(Math.abs((headerBox?.y ?? 99) - (brandBox?.y ?? 0))).toBeLessThan(ROW);
      const navBox = await header.boundingBox();
      expect(navBox?.height ?? 0).toBeGreaterThanOrEqual(56 - 1);
      expect(navBox?.height ?? 0).toBeLessThanOrEqual(COMPACT_MAX);
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
