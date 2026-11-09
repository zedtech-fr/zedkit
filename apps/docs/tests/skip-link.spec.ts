import { expect, test } from "@playwright/test";

/** P1: keyboard users jump past header/nav/search chrome on one keypress. */
for (const path of ["/", "/docs/set-up-your-coding-agents"]) {
  test(`skip link is the first tab stop and lands in the page on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    const landed = await page.evaluate(() => {
      const main = document.querySelector("main");
      return main !== null && main.contains(document.activeElement);
    });
    expect(landed).toBe(true);
  });
}
