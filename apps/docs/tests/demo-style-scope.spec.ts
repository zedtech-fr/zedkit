import { expect, test } from "@playwright/test";

import { SITE_DEFAULT_IDENTITY } from "../lib/default-identity";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

test("Style of this demo restyles the preview only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGE, { waitUntil: "networkidle" });

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-identity", SITE_DEFAULT_IDENTITY);
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  const rootSans = () =>
    html.evaluate((node) => getComputedStyle(node).getPropertyValue("--font-sans"));
  const before = await rootSans();

  await preview.getByRole("combobox", { name: "Style of this demo" }).selectOption("press");

  await expect(html).toHaveAttribute("data-identity", SITE_DEFAULT_IDENTITY);
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).not.toBe("press");
  expect(await rootSans()).toBe(before);
  const scope = preview.locator("[data-identity-scope]");
  await expect(scope).toHaveAttribute("data-identity", "press");
  await expect
    .poll(() => scope.evaluate((node) => getComputedStyle(node).getPropertyValue("--font-sans")))
    .toContain("Space Grotesk");
});
