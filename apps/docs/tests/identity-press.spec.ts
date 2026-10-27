import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns press on for the page (nothing selects an identity yet on the site). */
async function usePress(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "press");
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

test.describe("press identity", () => {
  test("sets a serif display over a grotesque body, with metric-aligned fallbacks", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Space Grotesk");

    await usePress(page, "light");
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
    await usePress(page, "light");
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)")).toBe("0px");
    expect(await probe(page, "box-shadow", "var(--zk-shadow-md)")).toMatch(/0px 0px 0px 0px/);
    expect(await probe(page, "box-shadow", "var(--zk-shadow-overlay)")).toMatch(/0px 0px 0px 1px/);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await usePress(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await usePress(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
