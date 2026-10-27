import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns volt on for the page (nothing selects an identity yet on the site). */
async function useVolt(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "volt");
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

test.describe("volt identity", () => {
  test("sets the page in Geist with a metric-aligned fallback and a 12px xs body", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Geist");

    await useVolt(page, "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Geist Variable"')).toBe(true);
    expect(body).toContain('"Geist Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading).toBe(body);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Geist Variable"'))).toBe(true);
    expect(await probe(page, "font-size", "var(--text-xs)")).toBe("12px");
  });

  test("uses hairline radii and an acid accent in dark", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useVolt(page, "dark");
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)")).toBe("6px");
    expect(await probe(page, "color", "hsl(var(--primary))")).toBe(await probe(page, "color", "hsl(72 90% 58%)"));
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useVolt(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useVolt(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
