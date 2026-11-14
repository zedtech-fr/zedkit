import { expect, test } from "@playwright/test";

import { featuredPackageVersion } from "../content/gallery";

for (const viewport of [
  { width: 390, height: 844, name: "390" },
  { width: 1024, height: 800, name: "1024" },
  { width: 1280, height: 800, name: "1280" },
] as const) {
  test.describe(`hero calm (${viewport.name}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("hero has no version caption in the header", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const shell = viewport.width < 768 ? page.locator("#nd-mobile-nav") : page.locator("#nd-nav");
      await expect(shell.getByText(new RegExp(`^v${featuredPackageVersion}$`))).toHaveCount(0);
      await expect(shell.locator("[data-kit-version]")).toHaveCount(0);
    });

    test("hero has no stray markup line", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const mainText = await page.locator("main").innerText();
      expect(mainText).not.toMatch(/<div data-identity=/);
    });
  });
}
