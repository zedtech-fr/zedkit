import { expect, test } from "@playwright/test";

import { featuredPackageVersion } from "../content/gallery";

const RELEASES_LABEL = new RegExp(`v${featuredPackageVersion.replace(/\./g, "\\.")} \\(releases\\)`);

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
] as const;

const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.05, animations: "disabled" } as const;

for (const theme of ["light", "dark"] as const) {
  for (const { name, width, height } of VIEWPORTS) {
    test(`${theme} home shell nav ${name}px`, async ({ page }) => {
      if (theme === "dark") {
        await page.addInitScript(() => localStorage.setItem("theme", "dark"));
      }
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      if (width < 768) {
        await page.getByRole("button", { name: "Open menu" }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Menu" })).toHaveScreenshot(
          `shell-nav-drawer-${theme}-${name}.png`,
          SCREENSHOT_OPTS,
        );
        await page.keyboard.press("Escape");
      } else {
        await expect(page.locator("#nd-nav")).toHaveScreenshot(`shell-nav-header-${theme}-${name}.png`, SCREENSHOT_OPTS);
      }
    });
  }
}

test.describe("shell nav calm guards", () => {
  test("desktop header has no identity control", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
    const shell = page.locator("#nd-nav");
    await expect(shell.locator("select")).toHaveCount(0);
    await expect(shell.getByRole("link", { name: RELEASES_LABEL })).toHaveCount(1);
  });

  test("phone header and drawer have no identity control or native select", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    const mobile = page.locator("#nd-mobile-nav");
    await expect(mobile.getByLabel("Try another identity")).toHaveCount(0);
    await expect(mobile.locator("select")).toHaveCount(0);
    await expect(mobile.getByRole("link", { name: RELEASES_LABEL })).toHaveCount(1);
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Try another identity")).toHaveCount(0);
    await expect(dialog.locator("select")).toHaveCount(0);
    await expect(dialog.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Guides", exact: true })).toHaveCount(0);
    await expect(dialog.getByText("Guides", { exact: true })).toBeVisible();
  });
});
