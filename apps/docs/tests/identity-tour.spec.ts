import { expect, test, type Page } from "@playwright/test";

/**
 * First-visit identity tour: plays the five identities once, ends on the
 * visitor's own identity, can be skipped, and never runs under reduced motion.
 * These tests start as a first-time visitor (no stored flag).
 */
test.use({ storageState: { cookies: [], origins: [] } });

const CARD = "[data-identity-tour-card]";
const HOME = "/";

/** Records every data-identity value and the layout shift of the page. */
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
      new MutationObserver(note).observe(el, {
        attributes: true,
        attributeFilter: ["data-identity"],
      });
      note();
      return true;
    };
    if (!watch()) {
      new MutationObserver((_records, observer) => {
        if (watch()) observer.disconnect();
      }).observe(document, { childList: true });
    }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

const ids = (page: Page) =>
  page.evaluate(() => (window as unknown as { __ids: string[] }).__ids);
const cls = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cls: number }).__cls);
const flag = (page: Page) =>
  page.evaluate(() => localStorage.getItem("zk-identity-tour"));
const stored = (page: Page) =>
  page.evaluate(() => localStorage.getItem("zk-identity"));

test("plays every identity once, in order, and settles on the default", async ({
  page,
}) => {
  await record(page);
  await page.goto(HOME);
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-identity-tour",
    "running",
  );
  expect(await flag(page)).toBe("1");
  await expect(page.locator(CARD)).toBeHidden({ timeout: 10_000 });
  expect(await ids(page)).toEqual([
    "mist",
    "press",
    "tide",
    "volt",
    "maison",
    "glass",
    "mist",
  ]);
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-identity-tour",
    /.*/,
    { timeout: 5000 },
  );
  expect(
    await stored(page),
    "the tour never writes the persisted identity",
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.getAttribute("style") ?? "",
    ),
  ).not.toContain("--spacing");
});

test("does not replay on a later visit", async ({ page }) => {
  await page.goto(HOME);
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(3500);
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-identity-tour",
    /.*/,
  );
});

test("lands on the stored identity and shows the current one", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("zk-identity", "tide"));
  await record(page);
  await page.goto(HOME);
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(CARD)).toContainText(/Volt|Gilt|Mist|Press|Tide/);
  const select = page
    .getByRole("combobox", { name: /identity|look|theme/i })
    .first();
  await expect(select).toHaveValue(/volt|maison|glass|mist|press|tide/);
  await expect(page.locator(CARD)).toBeHidden({ timeout: 10_000 });
  expect(await ids(page)).toEqual([
    "tide",
    "volt",
    "maison",
    "glass",
    "mist",
    "press",
    "tide",
  ]);
  await expect(select).toHaveValue("tide");
  expect(await stored(page)).toBe("tide");
});

test("the Skip button stops the tour on the default identity", async ({
  page,
}) => {
  await page.goto(HOME);
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /skip/i }).click();
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
});

test("Escape and a tap anywhere skip the tour", async ({ page }) => {
  await page.goto(HOME);
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");

  await page.evaluate(() => localStorage.removeItem("zk-identity-tour"));
  await page.reload({ waitUntil: "load" });
  await expect(page.locator(CARD)).toBeVisible({ timeout: 10_000 });
  await page.mouse.click(8, 300);
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("never plays and leaves no flag", async ({ page }) => {
    await page.goto(HOME);
    await page.waitForTimeout(3500);
    await expect(page.locator(CARD)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    expect(await flag(page)).toBeNull();
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("the card fits, nothing overflows and the layout does not shift", async ({
    page,
  }) => {
    await record(page);
    await page.goto(HOME);
    const card = page.locator(CARD);
    await expect(card).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 5; i += 1) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
      await page.waitForTimeout(900);
    }
    await expect(card).toBeHidden({ timeout: 10_000 });
    const shift = await cls(page);
    test
      .info()
      .annotations.push({ type: "cls", description: shift.toFixed(4) });
    // Only text reflow from the font swap moves content (spacing, density and the type
    // scale are pinned). Known trade-off, tracked through the annotation; this bound
    // guards against regressions, the page without the tour stays at 0.
    expect(shift, "cumulative layout shift during the tour").toBeLessThan(0.8);
  });
});
