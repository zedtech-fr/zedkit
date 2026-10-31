import { expect, test, type Page } from "@playwright/test";

const SIZES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
] as const;

async function openPhoneSearch(page: Page) {
  const trigger = page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

for (const size of SIZES) {
  test(`phone header search opens the dialog (${size.width}px)`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/docs/getting-started");
    const { trigger, dialog } = await openPhoneSearch(page);
    const input = dialog.locator("input").first();
    await expect(input).toBeFocused();
    expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    const triggerBox = (await trigger.boundingBox())!;
    expect(triggerBox.y + triggerBox.height).toBeLessThan(80);
    await expect(page.locator("[data-search-pill]")).toHaveCount(0);
    await input.fill("drawer");
    await expect(dialog.getByRole("link").first()).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

for (const path of ["/docs/getting-started", "/docs/ui/trigger-actions-with-buttons"] as const) {
  test(`header search stays in the chrome on long pages (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(path, { waitUntil: "networkidle" });
    const trigger = page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" });
    await expect(trigger).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(trigger).toBeVisible();
  });
}

test("Escape closes the phone search dialog", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  const { trigger, dialog } = await openPhoneSearch(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  test("search dialog opens without travel animations", async ({ page }) => {
    await page.goto("/");
    await openPhoneSearch(page);
    expect(await page.evaluate(() => document.querySelector("[data-search-bar]")?.getAnimations().length ?? 0)).toBe(0);
    await page.keyboard.press("Escape");
  });
});
