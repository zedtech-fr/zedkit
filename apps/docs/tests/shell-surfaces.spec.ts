import { expect, test } from "@playwright/test";

/*
 * Calm shell surfaces: identities dress the page (Volt draws a grid
 * under the prose). Docs and catalog shells keep a flat reading
 * surface in light mode; dark ambiance and the home page are
 * untouched. Relative paths: the config baseURL decides the port.
 */
for (const path of ["/docs/getting-started", "/catalog"]) {
  test(`light ${path} has a flat page background`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(background).toBe("none");
  });
}

test("home keeps its identity backdrop", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(background).not.toBe("none");
});

test("dark docs keep their ambiance", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(background).not.toBe("none");
});
