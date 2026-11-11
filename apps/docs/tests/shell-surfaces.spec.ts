import { expect, test } from "@playwright/test";

/*
 * Calm shell surfaces: every site route is a flat reading surface.
 * Light and dark both drop the identity page radial. Relative paths:
 * the config baseURL decides the port.
 */
for (const path of ["/", "/docs/getting-started", "/catalog"]) {
  test(`light ${path} has a flat page background`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(background).toBe("none");
  });
}

test("dark docs have a flat page background", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(background).toBe("none");
});
