import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

test.describe("press identity", () => {
  test("sets a serif display over a grotesque body, with metric-aligned fallbacks", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Space Grotesk");

    await useIdentity(page, "press", "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Space Grotesk Variable"')).toBe(true);
    expect(body).toContain('"Space Grotesk Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Newsreader Variable"')).toBe(true);
    expect(heading).toContain('"Newsreader Variable Fallback"');
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Space Grotesk Variable"')))
      .toBe(true);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Newsreader Variable"'))).toBe(true);
  });

  test("has square corners, no soft shadows and a 1px overlay edge", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "press", "light");
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)")).toBe("0px");
    expect(await probe(page, "box-shadow", "var(--zk-shadow-md)")).toMatch(/0px 0px 0px 0px/);
    expect(await probe(page, "box-shadow", "var(--zk-shadow-overlay)")).toMatch(/0px 0px 0px 1px/);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "press", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "press", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
