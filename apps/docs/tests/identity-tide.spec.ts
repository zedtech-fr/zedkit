import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns tide on for the page (nothing selects an identity yet on the site). */
async function useTide(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "tide");
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    root.style.colorScheme = mode;
  }, theme);
  await page.evaluate(() => document.fonts.ready);
}

/** Computed value of a CSS expression, read through a probe element in <main>. */
async function probe(page: Page, property: string, value: string) {
  return page.evaluate(
    ([prop, val]) => {
      const el = document.createElement("span");
      el.style.setProperty(prop, val);
      document.querySelector("main")!.appendChild(el);
      const out = getComputedStyle(el).getPropertyValue(prop);
      el.remove();
      return out;
    },
    [property, value] as const,
  );
}

test.describe("tide identity", () => {
  test("sets Inter at heavy heading weights with large radii", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Inter");

    await useTide(page, "light");
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
    await useTide(page, "light");
    const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);
    expect(ms(await probe(page, "transition-duration", "var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-slow)"))).toBeLessThanOrEqual(300);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useTide(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useTide(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
