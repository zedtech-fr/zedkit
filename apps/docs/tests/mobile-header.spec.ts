import { expect, test } from "@playwright/test";

const PAGES = ["/", "/docs/identities-and-theming"];

for (const path of PAGES) {
  test.describe(`phone header on ${path}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("mark left, identity chooser centred, no overflow, 44px targets", async ({ page }) => {
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      await expect(header).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const picker = header.getByRole("button", { name: /^Identity: / });
      await expect(picker).toBeVisible();
      await expect(picker).toContainText("Mist");
      const pBox = await picker.boundingBox();
      expect(Math.abs((pBox?.x ?? 0) + (pBox?.width ?? 0) / 2 - 195)).toBeLessThanOrEqual(12);
      for (const button of await header.locator("a, button").all()) {
        const box = await button.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(43.5);
      }
      await expect(page.getByText("v0.4.0")).toHaveCount(path === "/" ? 1 : 0);
    });

    test("the chooser lists identities and applies the pick", async ({ page }) => {
      await page.goto(path);
      await page.locator("#nd-mobile-nav").getByRole("button", { name: /^Identity: / }).click();
      const list = page.getByRole("radiogroup", { name: "Identity" });
      await expect(list.getByRole("radio")).toHaveCount(6);
      await list.getByRole("radio", { name: /Press/ }).click();
      await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    });

    test("the search button floats bottom-right and opens search with focus", async ({ page }) => {
      await page.goto(path);
      const fab = page.getByRole("button", { name: "Search the documentation" });
      await expect(fab).toBeVisible();
      const box = await fab.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThan(390 - 40);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(844 - 40);
      await fab.click();
      await expect(page.getByRole("searchbox")).toBeFocused();
    });
  });
}

test("desktop keeps the stock header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#nd-mobile-nav")).toBeHidden();
  await expect(page.locator("#nd-nav")).toBeVisible();
});
