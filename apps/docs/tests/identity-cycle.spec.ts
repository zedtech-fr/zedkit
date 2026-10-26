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
    return {
      title: read("#home-page h1"),
      cta: read("#home-page a[href='#ai-setup']"),
      next: read("#ai-setup"),
    };
  });

test("every load crossfades the whole hero, then settles on the page's identity", async ({ page }) => {
  for (const visit of [1, 2]) {
    await record(page);
    await page.goto(HOME);
    const before = await fixed(page);
    await expect(page.locator(LAYER)).toHaveCount(6, { timeout: 10_000 });
    // Title, promise and main call to action do not move or change while it plays; neither does what follows.
    expect(await fixed(page)).toEqual(before);
    // Layers live in the hero, and stay hidden from assistive technology.
    await expect(page.locator(`[data-identity-cycle] ${LAYER}`)).toHaveCount(6);
    for (const layer of await page.locator(LAYER).all()) {
      await expect(layer).toHaveAttribute("aria-hidden", "true");
      await expect(layer).toHaveAttribute("inert", "");
    }
    // The whole hero restyles, text unchanged: one title, promise and button label per layer, different type, background and corners.
    const looks = await page.evaluate((selector) =>
      Array.from(document.querySelectorAll(selector)).map((layer) => {
        const h1 = layer.querySelector("h1");
        const cta = layer.querySelector("a[href='#ai-setup']");
        const button = cta?.closest("a, button") ?? cta;
        const card = layer.querySelector("[data-home-hero-preview] > div");
        return {
          title: h1?.textContent,
          cta: cta?.textContent,
          font: h1 ? getComputedStyle(h1).fontFamily : "",
          background: getComputedStyle(layer, "::before").backgroundColor,
          buttonRadius: button ? getComputedStyle(button).borderTopLeftRadius : "",
          cardRadius: card ? getComputedStyle(card).borderTopLeftRadius : "",
        };
      }), LAYER);
    expect(new Set(looks.map((look) => look.title)).size).toBe(1);
    expect(new Set(looks.map((look) => look.cta)).size).toBe(1);
    expect(looks[0].title).toBe(before.title?.text);
    expect(new Set(looks.map((look) => look.font)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(looks.map((look) => look.background)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(looks.map((look) => look.buttonRadius + look.cardRadius)).size).toBeGreaterThanOrEqual(3);
    // The backdrop reaches both window edges.
    const reach = await page.evaluate((selector) => {
      const layer = document.querySelector(selector);
      if (!layer) return null;
      const box = getComputedStyle(layer, "::before");
      const rect = layer.getBoundingClientRect();
      return {
        left: rect.left + parseFloat(box.left),
        right: rect.right - parseFloat(box.right),
        width: document.documentElement.clientWidth,
      };
    }, LAYER);
    expect(reach?.left).toBeLessThanOrEqual(1);
    expect(reach?.right).toBeGreaterThanOrEqual((reach?.width ?? 0) - 1);
    // No horizontal scroll caused by the layers.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 8_000 });
    expect(await fixed(page)).toEqual(before);
    // Nothing global: no identity change on <html>, nothing written to storage.
    expect(await ids(page)).toEqual(["mist"]);
    await expect(page.locator("html")).not.toHaveAttribute("style", /--/);
    expect(await storage(page)).toEqual([]);
    expect(await cls(page), `visit ${visit}`).toBeLessThan(0.05);
  }
});

test("no copy of the hero becomes the largest contentful paint", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: { time: number; inLayer: boolean; tag: string }[] };
    w.__lcp = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { startTime: number; element?: Element }[]) {
        w.__lcp.push({
          time: Math.round(entry.startTime),
          inLayer: Boolean(entry.element?.closest("[data-identity-cycle-layer]")),
          tag: entry.element?.tagName ?? "",
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(HOME);
  await expect(page.locator(LAYER)).toHaveCount(6, { timeout: 10_000 });
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 8_000 });
  const entries = await page.evaluate(() => (window as unknown as { __lcp: { time: number; inLayer: boolean; tag: string }[] }).__lcp);
  expect(entries.length).toBeGreaterThan(0);
  expect(entries.filter((entry) => entry.inLayer), JSON.stringify(entries)).toEqual([]);
  // Largest paint settled early: the real content, not the animation, decides it.
  expect(entries[entries.length - 1].time, JSON.stringify(entries)).toBeLessThan(2_500);
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
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
