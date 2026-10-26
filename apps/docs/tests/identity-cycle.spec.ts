import { expect, test, type Page } from "@playwright/test";

/**
 * Hero identity cycle: crossfades through every identity inside the hero
 * only, on every load, never touches <html data-identity> or storage,
 * stops at the first gesture and never runs under reduced motion.
 */
test.use({ reducedMotion: "no-preference", storageState: { cookies: [], origins: [] } });

const LAYER = "[data-identity-cycle-layer]";
const HOME = "/";

/** Records every data-identity value of <html> and the layout shift of the page. */
async function record(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __ids: string[]; __cls: number };
    w.__ids = [];
    w.__cls = 0;
    const note = () => {
      const id = document.documentElement?.getAttribute("data-identity") ?? "";
      if (id && w.__ids[w.__ids.length - 1] !== id) w.__ids.push(id);
    };
    const watch = () => {
      const el = document.documentElement;
      if (!el) return false;
      new MutationObserver(note).observe(el, { attributes: true, attributeFilter: ["data-identity", "style", "data-identity-tour"] });
      note();
      return true;
    };
    if (!watch()) {
      new MutationObserver((_records, observer) => {
        if (watch()) observer.disconnect();
      }).observe(document, { childList: true });
    }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

const ids = (page: Page) => page.evaluate(() => (window as unknown as { __ids: string[] }).__ids);
const cls = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);
const storage = (page: Page) => page.evaluate(() => Object.keys(localStorage));
const fixed = (page: Page) =>
  page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector);
      const box = el?.getBoundingClientRect();
      return el ? { text: el.textContent, top: Math.round(box!.top), height: Math.round(box!.height) } : null;
    };
    return { title: read("#home-page h1"), cta: read("#home-page a[href='#ai-setup']") };
  });

test("every load crossfades inside the hero only, then settles on the page's identity", async ({ page }) => {
  for (const visit of [1, 2]) {
    await record(page);
    await page.goto(HOME);
    const before = await fixed(page);
    await expect(page.locator(LAYER)).toHaveCount(6, { timeout: 10_000 });
    // Title, promise and main call to action do not move or change while it plays.
    expect(await fixed(page)).toEqual(before);
    // Layers live in the hero preview, and stay hidden from assistive technology.
    await expect(page.locator(`[data-home-hero-preview] ${LAYER}`)).toHaveCount(6);
    for (const layer of await page.locator(LAYER).all()) {
      await expect(layer).toHaveAttribute("aria-hidden", "true");
    }
    await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 8_000 });
    expect(await fixed(page)).toEqual(before);
    // Nothing global: no identity change on <html>, nothing written to storage.
    expect(await ids(page)).toEqual(["mist"]);
    await expect(page.locator("html")).not.toHaveAttribute("style", /--/);
    expect(await storage(page)).toEqual([]);
    expect(await cls(page), `visit ${visit}`).toBeLessThan(0.05);
  }
});

test("lasts under four seconds", async ({ page }) => {
  await page.goto(HOME);
  await expect(page.locator(LAYER).first()).toBeAttached({ timeout: 10_000 });
  const started = Date.now();
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 8_000 });
  expect(Date.now() - started).toBeLessThan(4_000);
});

test("the first gesture stops it", async ({ page }) => {
  await page.goto(HOME);
  await expect(page.locator(LAYER).first()).toBeAttached({ timeout: 10_000 });
  await page.keyboard.press("Shift");
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 1_500 });
});

test("settles on the stored identity and does not change it", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("zk-identity", "press"));
  await page.goto(HOME);
  await expect(page.locator(LAYER)).toHaveCount(6, { timeout: 10_000 });
  await expect(page.locator(LAYER).last()).toHaveAttribute("data-identity-cycle-layer", "press");
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 8_000 });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).toBe("press");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("never plays", async ({ page }) => {
    await page.goto(HOME);
    await page.waitForTimeout(5_000);
    await expect(page.locator(LAYER)).toHaveCount(0);
    await expect(page.locator("[data-home-hero-preview]")).toBeVisible();
  });
});
