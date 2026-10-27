import { expect, test } from "@playwright/test";

// Default look only: every built-in look joins this matrix once the identities are listed in the chooser.
const SIZES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
];

for (const size of SIZES) {
  {
    test(`phone search bar opens at the top, the magnifier stays (${size.width}px)`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/docs/getting-started");
      const magnifier = page.getByRole("button", { name: "Search the documentation" });
      await expect(magnifier).toBeVisible();
      const closed = (await magnifier.boundingBox())!;
      expect(closed.width).toBeGreaterThanOrEqual(43.5);

      await magnifier.click();
      const field = page.getByRole("searchbox");
      await expect(field).toBeFocused();
      expect(await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

      // The magnifier stays where it is, at the bottom right; the bar is at the top, full width.
      await expect.poll(async () => (await field.boundingBox())?.width ?? 0).toBeGreaterThan(size.width - 140);
      const open = (await magnifier.boundingBox())!;
      expect(Math.abs(open.x - closed.x)).toBeLessThan(2);
      expect(Math.abs(open.y - closed.y)).toBeLessThan(2);
      const fieldBox = (await field.boundingBox())!;
      expect(fieldBox.y).toBeLessThan(80);
      const close = page.getByRole("button", { name: "Close search" });
      expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(43.5);

      // Results appear right under the bar, inside the viewport, at most ~60% of its height.
      await field.fill("drawer");
      const results = page.getByRole("list", { name: "Search results" });
      await expect(results).toBeVisible();
      const sheet = (await page.locator("#phone-search-results").boundingBox())!;
      expect(sheet.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height - 1);
      expect(sheet.y + sheet.height).toBeLessThanOrEqual(size.height);
      expect(sheet.x).toBeGreaterThanOrEqual(0);
      expect(sheet.x + sheet.width).toBeLessThanOrEqual(size.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      await close.click();
      await expect(field).toHaveCount(0);
      await expect(magnifier).toBeFocused();
      await expect.poll(async () => (await magnifier.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(43.5);
    });
  }
}

test("Escape closes the phone search bar", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search the documentation" })).toBeFocused();
});

test("tapping outside closes the phone search bar and returns focus to the magnifier", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  const magnifier = page.getByRole("button", { name: "Search the documentation" });
  await magnifier.click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.mouse.click(20, 120);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(magnifier).toBeFocused();
});

test("the bar opens without a width transition", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  const pill = page.getByRole("search");
  expect(await pill.evaluate((el) => getComputedStyle(el).transitionProperty)).not.toContain("width");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  test("the bar has no width transition", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search the documentation" }).click();
    const pill = page.getByRole("search");
    expect(await pill.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  });
});
