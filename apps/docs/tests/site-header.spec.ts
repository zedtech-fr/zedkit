import { expect, test } from "@playwright/test";

import { siteChromeCopy } from "../components/site-chrome/i18n/site-chrome-copy";

test.describe("site header navigation (#1034)", () => {
  test("desktop header links AI, UI, Docs, Catalog, and Issues", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await expect(header.getByRole("link", { name: "AI", exact: true })).toHaveAttribute("href", "/docs/ai/setup");
    await expect(header.getByRole("link", { name: "UI", exact: true })).toHaveAttribute("href", "/docs/foundations");
    await expect(header.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
    await expect(
      header.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(header.getByRole("link", { name: "Issues", exact: true })).toHaveAttribute("href", "/issues");
    await expect(header.getByRole("link", { name: "UI changelog" })).toHaveCount(0);
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  });

  test("desktop header brand aligns across home, docs, catalog, and issues", async ({ page }) => {
    const routes = ["/", "/docs/ai/setup", "/docs/foundations", "/catalog", "/issues"] as const;
    for (const width of [809, 1440] as const) {
      await page.setViewportSize({ width, height: 900 });
      const lefts: number[] = [];
      for (const route of routes) {
        await page.goto(route, { waitUntil: "networkidle" });
        const header = page.locator("#nd-nav");
        await expect(header).toBeVisible();
        lefts.push(await header.locator("nav a").first().evaluate((el) => el.getBoundingClientRect().left));
      }
      const first = lefts[0];
      for (let i = 0; i < routes.length; i++) {
        expect(Math.abs(lefts[i] - first), `${routes[i]} at ${width}px`).toBeLessThanOrEqual(1);
      }
      if (width === 1440) {
        const navWidth = await page.locator("#nd-nav nav").evaluate((el) => el.getBoundingClientRect().width);
        expect(navWidth).toBeLessThanOrEqual(1400);
      }
    }
  });

  test("phone header brand aligns across home, docs, catalog, and issues", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const routes = ["/", "/docs/ai/setup", "/docs/foundations", "/catalog", "/issues"] as const;
    const lefts: number[] = [];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });
      const header = page.locator("#nd-mobile-nav");
      await expect(header).toBeVisible();
      lefts.push(await header.locator("a").first().evaluate((el) => el.getBoundingClientRect().left));
    }
    const first = lefts[0];
    for (let i = 0; i < routes.length; i++) {
      expect(Math.abs(lefts[i] - first), routes[i]).toBeLessThanOrEqual(1);
    }
  });

  test("a deep docs page reaches the catalog from its chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Catalog", exact: true }).first(),
    ).toHaveAttribute("href", "/catalog");
  });

  test("home header has no Guides menu; Getting started stays on Docs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await expect(header.getByRole("button", { name: "Guides" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Guides", exact: true })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Reviews" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Issues", exact: true })).toHaveAttribute("href", "/issues");
    await expect(header.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toHaveAttribute(
      "href",
      "https://github.com/zedtech-fr/zedkit",
    );
    await expect(header.getByRole("link", { name: siteChromeCopy.getStarted, exact: true })).toHaveAttribute(
      "href",
      "#get-started",
    );
    await expect(header.locator('a[href="/docs"]')).toHaveCount(1);
    await expect(header.locator('a[href="/docs/foundations"]')).toHaveCount(1);

    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Getting started" })).toBeVisible();
  });

  test("phone header lists AI, UI, Docs, Catalog, and Issues", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/", { waitUntil: "networkidle" });

    const header = page.locator("#nd-mobile-nav");
    await expect(header.getByRole("button", { name: "Open menu" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: siteChromeCopy.getStarted, exact: true })).toHaveAttribute(
      "href",
      "#get-started",
    );
    const menu = header.getByRole("button", { name: "Menu", exact: true });
    await menu.click();
    const dialog = page.getByRole("dialog", { name: "Site navigation" });
    await expect(dialog.getByRole("link", { name: "AI", exact: true })).toHaveAttribute("href", "/docs/ai/setup");
    await expect(dialog.getByRole("link", { name: "UI", exact: true })).toHaveAttribute("href", "/docs/foundations");
    await expect(dialog.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
    await expect(
      dialog.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(dialog.getByRole("link", { name: "Issues", exact: true })).toHaveAttribute("href", "/issues");
    await expect(header.getByRole("link", { name: "UI changelog" })).toHaveCount(0);
    await expect(header.getByText("Guides", { exact: true })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Getting started", exact: true })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toBeVisible();
  });
});
