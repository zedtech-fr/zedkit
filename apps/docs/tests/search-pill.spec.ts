import { expect, test, type Page } from "@playwright/test";

/** The bar unrolls from the magnifier when it opens; measure only once that travel is over. */
const settled = (page: Page) =>
  page.waitForFunction(() => (document.querySelector("[data-search-bar]")?.getAnimations().length ?? 1) === 0);

/** At maximum scroll, named controls still rendered underneath the floating magnifier. */
const endOfPageOverlaps = (page: Page) =>
  page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const magnifier = document
      .querySelector("[data-search-pill] button[aria-label='Search the documentation']")
      ?.getBoundingClientRect();
    if (!magnifier) return ["missing phone search button"];
    return [...document.querySelectorAll<HTMLElement>("main a, main button")]
      .filter((element) => !element.closest("[data-search-pill]"))
      .map((element) => {
        const box = element.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(box.right, magnifier.right) - Math.max(box.left, magnifier.left));
        const overlapHeight = Math.max(0, Math.min(box.bottom, magnifier.bottom) - Math.max(box.top, magnifier.top));
        return {
          label: (element.getAttribute("aria-label") || element.textContent || element.tagName)
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 80),
          area: overlapWidth * overlapHeight,
        };
      })
      .filter(({ area }) => area > 0)
      .map(({ label }) => label);
  });


// Default look only: every built-in look joins this matrix once the identities are listed in the chooser.
const SIZES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
];

for (const size of SIZES) {
  {
    test(`phone search bar opens at the top, the magnifier is hidden meanwhile (${size.width}px)`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/docs/getting-started");
      const magnifier = page.getByRole("button", { name: "Search the documentation" });
      await expect(magnifier).toBeVisible();
      const closed = (await magnifier.boundingBox())!;
      expect(closed.width).toBeGreaterThanOrEqual(43.5);

      await magnifier.click();
      await settled(page);
      const field = page.getByRole("searchbox");
      await expect(field).toBeFocused();
      expect(await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

      // The magnifier is hidden while the bar is open; the bar is at the top, full width.
      await settled(page);
      await expect(magnifier).toBeHidden();
      await expect.poll(async () => (await field.boundingBox())?.width ?? 0).toBeGreaterThan(size.width - 140);
      const fieldBox = (await field.boundingBox())!;
      expect(fieldBox.y).toBeLessThan(80);
      const close = page.getByRole("button", { name: "Close search" });
      expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(43.5);

      // Results appear right under the bar, inside the viewport, at most ~60% of its height.
      await field.fill("drawer");
      const results = page.getByRole("list", { name: "Search results" });
      await expect(results).toBeVisible();
      const sheet = (await page.locator("#phone-search-results").boundingBox())!;
      expect(sheet.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height - 1);
      expect(sheet.y + sheet.height).toBeLessThanOrEqual(size.height);
      expect(sheet.x).toBeGreaterThanOrEqual(0);
      expect(sheet.x + sheet.width).toBeLessThanOrEqual(size.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      await close.click();
      await expect(field).toHaveCount(0);
      await expect(magnifier).toBeVisible();
      await expect(magnifier).toBeFocused();
      const back = (await magnifier.boundingBox())!;
      expect(Math.abs(back.x - closed.x)).toBeLessThan(2);
      expect(Math.abs(back.y - closed.y)).toBeLessThan(2);
    });
  }
}

for (const path of ["/docs/getting-started", "/docs/ui/trigger-actions-with-buttons"] as const) {
  test(`end-of-page links scroll clear of phone search (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Search the documentation" })).toBeVisible();
    await expect.poll(() => endOfPageOverlaps(page)).toEqual([]);
  });
}

test("Escape closes the phone search bar", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search the documentation" })).toBeFocused();
});

test("tapping outside closes the phone search bar and returns focus to the magnifier", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  const magnifier = page.getByRole("button", { name: "Search the documentation" });
  await magnifier.click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.mouse.click(20, 120);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(magnifier).toBeFocused();
});

test("the bar unrolls from the magnifier to the top and folds back into it", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const magnifier = page.getByRole("button", { name: "Search the documentation" });
  const rest = (await magnifier.boundingBox())!;
  // Catch the travel the moment the bar is mounted and hold it, so each frame can be measured exactly.
  await page.evaluate(() => {
    (window as unknown as { __travel: Promise<void> }).__travel = new Promise((resolve) => {
      const watcher = new MutationObserver(() => {
        const travel = document.querySelector("[data-search-bar]")?.getAnimations()[0];
        if (!travel) return;
        travel.pause();
        travel.currentTime = 0;
        watcher.disconnect();
        resolve();
      });
      watcher.observe(document.body, { childList: true, subtree: true });
    });
  });
  await magnifier.click();
  const frames = await page.evaluate(async () => {
    await (window as unknown as { __travel: Promise<void> }).__travel;
    const bar = document.querySelector("[data-search-bar]")!;
    const travel = bar.getAnimations()[0]!;
    const box = () => {
      const r = bar.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const start = box();
    travel.currentTime = 60;
    const middle = box();
    travel.finish();
    return { start, middle, end: box() };
  });
  // Start: folded onto the magnifier. End: the full-width bar at the top. In between: on the way.
  expect(Math.abs(frames.start.x + frames.start.width / 2 - (rest.x + rest.width / 2))).toBeLessThan(2);
  expect(Math.abs(frames.start.y + frames.start.height / 2 - (rest.y + rest.height / 2))).toBeLessThan(2);
  expect(frames.end.y).toBeLessThan(80);
  expect(frames.end.width).toBeGreaterThan(SIZES[1]!.width - 80);
  expect(frames.middle.y).toBeGreaterThan(frames.end.y + 20);
  expect(frames.middle.y).toBeLessThan(frames.start.y - 20);
  await settled(page);
  // Closing folds it back: it is on its way down, then the magnifier is back.
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(magnifier).toBeVisible();
  await expect(magnifier).toBeFocused();
});

test("the bar opens without a width transition", async ({ page }) => {
  await page.setViewportSize(SIZES[1]!);
  await page.goto("/");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  await settled(page);
  const pill = page.getByRole("search");
  expect(await pill.evaluate((el) => getComputedStyle(el).transitionProperty)).not.toContain("width");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  test("the bar has no width transition", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search the documentation" }).click();
    // No travel: nothing animates, the bar is simply there.
    expect(await page.evaluate(() => document.querySelector("[data-search-bar]")?.getAnimations().length)).toBe(0);
    const pill = page.getByRole("search");
    expect(await pill.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
    await page.getByRole("button", { name: "Close search" }).click();
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Search the documentation" })).toBeFocused();
  });
});
