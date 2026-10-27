import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns maison on for the page (nothing selects an identity yet on the site). */
async function useMaison(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "maison");
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

const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);

test.describe("maison identity", () => {
  test("sets Cormorant headings over a Jost body, with fallback faces", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Jost");

    await useMaison(page, "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Jost Variable"')).toBe(true);
    expect(body).toContain('"Jost Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Cormorant Variable"')).toBe(true);
    expect(heading).toContain('"Cormorant Variable Fallback"');
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Jost Variable"'))).toBe(true);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Cormorant Variable"'))).toBe(true);
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)")).toBe("2px");
  });

  test("keeps interactions within the caps and saves the slow motion for reveals", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useMaison(page, "light");
    expect(ms(await probe(page, "transition-duration", "var(--motion-fast)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-slow)"))).toBeLessThanOrEqual(300);
    expect(ms(await probe(page, "transition-duration", "var(--zk-lift-duration)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--zk-reveal-duration)"))).toBeGreaterThan(300);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useMaison(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useMaison(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
