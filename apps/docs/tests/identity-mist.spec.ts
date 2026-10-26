import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns mist on for the page (nothing selects an identity yet on the site). */
async function useMist(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "mist");
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    root.style.colorScheme = mode;
  }, theme);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("mist identity", () => {
  test("sets the page in self-hosted Inter, with a metric-aligned fallback", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Inter");

    await useMist(page, "light");
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family.startsWith('"Inter Variable"')).toBe(true);
    expect(family).toContain('"Inter Variable Fallback"');
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Inter Variable"')))
      .toBe(true);
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading).toBe(family);
  });

  test("text selection uses the inverted accent pair", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useMist(page, "light");
    const selection = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "hsl(var(--accent-foreground))";
      probe.style.backgroundColor = "hsl(var(--accent))";
      document.querySelector("main")!.appendChild(probe);
      const accent = getComputedStyle(probe);
      const pair = { fg: accent.backgroundColor, bg: accent.color };
      const picked = getComputedStyle(document.querySelector("h1")!, "::selection");
      probe.remove();
      return { pair, picked: { fg: picked.color, bg: picked.backgroundColor } };
    });
    expect(selection.picked).toEqual(selection.pair);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useMist(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useMist(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
