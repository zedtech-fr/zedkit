import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Turns glass on for the page (nothing selects an identity yet on the site). */
async function useGlass(page: Page, theme: "light" | "dark") {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute("data-identity", "glass");
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    root.style.colorScheme = mode;
  }, theme);
  await page.evaluate(() => document.fonts.ready);
}

/** Computed style of a fresh element with the given classes, appended to <main>. */
async function surface(page: Page, className: string) {
  return page.evaluate((cls) => {
    const el = document.createElement("div");
    el.className = cls;
    document.querySelector("main")!.appendChild(el);
    const style = getComputedStyle(el);
    const out = { background: style.backgroundColor, filter: style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter") };
    el.remove();
    return out;
  }, className);
}

const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);

test.describe("glass identity", () => {
  test("makes cards and popovers translucent with a backdrop blur", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await surface(page, "bg-card border");
    expect(stock.filter === "" || stock.filter === "none").toBe(true);

    await useGlass(page, "light");
    for (const cls of ["bg-card border", "bg-popover border"]) {
      const glass = await surface(page, cls);
      expect(glass.background).toMatch(/\/ 0\.\d+\)$|rgba\(.*, 0\.\d+\)$/);
      expect(glass.filter).toContain("blur(");
    }
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Inter Variable"')).toBe(true);
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Space Grotesk Variable"')).toBe(true);
  });

  test("keeps a scope with another identity solid inside a glass page", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useGlass(page, "light");
    const nested = await page.evaluate(() => {
      const scope = document.createElement("div");
      scope.setAttribute("data-identity-scope", "");
      scope.setAttribute("data-identity", "mist");
      const card = document.createElement("div");
      card.className = "bg-card border";
      scope.appendChild(card);
      document.querySelector("main")!.appendChild(scope);
      const style = getComputedStyle(card);
      const out = { background: style.backgroundColor, filter: style.backdropFilter };
      scope.remove();
      return out;
    });
    expect(nested.filter === "" || nested.filter === "none").toBe(true);
    expect(nested.background).not.toMatch(/rgba\(.*, 0\.\d+\)$/);
  });

  test("keeps interaction motion within the caps", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useGlass(page, "light");
    const probe = (value: string) =>
      page.evaluate((val) => {
        const el = document.createElement("span");
        el.style.transitionDuration = val;
        document.querySelector("main")!.appendChild(el);
        const out = getComputedStyle(el).transitionDuration;
        el.remove();
        return out;
      }, value);
    expect(ms(await probe("var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe("var(--motion-slow)"))).toBeLessThanOrEqual(300);
    expect(ms(await probe("var(--zk-lift-duration)"))).toBeLessThanOrEqual(200);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useGlass(page, theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useGlass(page, "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
