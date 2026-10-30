import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

test.describe("tide identity", () => {
  test("sets Inter at heavy heading weights with large radii", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "tide", "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Inter Variable"')).toBe(true);
    expect(body).toContain('"Inter Variable Fallback"');
    const h1 = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector("h1")!);
      return { family: style.fontFamily, weight: style.fontWeight };
    });
    expect(h1.family).toBe(body);
    expect(h1.weight).toBe("700");
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)")).toBe("24px");
  });

  test("keeps interaction motion within the caps", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "tide", "light");
    const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);
    expect(ms(await probe(page, "transition-duration", "var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-slow)"))).toBeLessThanOrEqual(300);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "tide", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "tide", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
