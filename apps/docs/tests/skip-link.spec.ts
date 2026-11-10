import { expect, test } from "@playwright/test";

/** P1: keyboard users jump past header/nav/search chrome on one keypress. */
for (const path of ["/", "/docs/set-up-your-coding-agents"]) {
  test(`skip link is the first tab stop and lands in the page on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const skip = page.getByRole("link", { name: "Skip to content" });
    const main = page.locator("main").first();

    const hiddenBox = await skip.boundingBox();
    expect(
      hiddenBox === null || hiddenBox.width <= 1 || hiddenBox.height <= 1,
      "skip link stays visually hidden until focused",
    ).toBe(true);

    const mainYBefore = (await main.boundingBox())?.y ?? Number.NaN;

    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();

    const shownBox = await skip.boundingBox();
    expect(shownBox, "skip link paints a real box on focus").not.toBeNull();
    expect(shownBox!.width).toBeGreaterThan(40);
    expect(shownBox!.height).toBeGreaterThan(20);
    expect(await skip.evaluate((el) => getComputedStyle(el).position)).toMatch(/^(absolute|fixed)$/);

    const mainYAfter = (await main.boundingBox())?.y ?? Number.NaN;
    expect(Math.abs(mainYAfter - mainYBefore)).toBeLessThan(1);

    await expect(page.locator("#main-content")).toHaveCount(1);

    await page.keyboard.press("Enter");
    const landed = await page.evaluate(() => {
      const active = document.activeElement;
      const target = document.getElementById("main-content");
      const pageMain = document.querySelector("main");
      if (active === null) return false;
      if (target !== null && (active === target || target.contains(active))) return true;
      return pageMain !== null && (active === pageMain || pageMain.contains(active));
    });
    expect(landed).toBe(true);
  });
}
