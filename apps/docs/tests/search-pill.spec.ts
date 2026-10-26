import { expect, test } from "@playwright/test";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const SIZES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
];

for (const size of SIZES) {
  for (const identity of IDENTITIES) {
    test(`phone search pill stretches from the magnifier (${identity}, ${size.width}px)`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.addInitScript((id) => {
        localStorage.setItem("zk-identity", id);
        localStorage.setItem("zk-identity-tour", "1");
      }, identity);
      await page.goto("/docs/identities-and-theming");
      const magnifier = page.getByRole("button", { name: "Search the documentation" });
      await expect(magnifier).toBeVisible();
      const closed = (await magnifier.boundingBox())!;
      expect(closed.width).toBeGreaterThanOrEqual(43.5);

      await magnifier.click();
      const field = page.getByRole("searchbox");
      await expect(field).toBeFocused();
      expect(await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

      // The magnifier keeps its place as the right end; the pill grows to the left, at the bottom.
      await expect.poll(async () => (await field.boundingBox())?.width ?? 0).toBeGreaterThan(size.width - 140);
      const open = (await magnifier.boundingBox())!;
      expect(Math.abs(open.x - closed.x)).toBeLessThan(2);
      expect(Math.abs(open.y - closed.y)).toBeLessThan(2);
      const fieldBox = (await field.boundingBox())!;
      expect(fieldBox.x).toBeLessThan(open.x);
      expect(fieldBox.y).toBeGreaterThan(size.height - 120);
      const close = page.getByRole("button", { name: "Close search" });
      expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(43.5);

      // Results appear above the pill, inside the viewport, at most ~60% of its height.
      await field.fill("identity");
      const results = page.getByRole("list", { name: "Search results" });
      await expect(results).toBeVisible();
      const sheet = (await page.locator("#phone-search-results").boundingBox())!;
      expect(sheet.y + sheet.height).toBeLessThanOrEqual(fieldBox.y + 1);
      expect(sheet.height).toBeLessThanOrEqual(size.height * 0.6 + 1);
      expect(sheet.x).toBeGreaterThanOrEqual(0);
      expect(sheet.x + sheet.width).toBeLessThanOrEqual(size.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      await close.click();
      await expect(field).toHaveCount(0);
      await expect.poll(async () => (await magnifier.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(43.5);
    });
  }
}

test("Escape closes the phone search pill", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  test("the pill has no width transition", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search the documentation" }).click();
    const pill = page.getByRole("search");
    expect(await pill.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  });
});
