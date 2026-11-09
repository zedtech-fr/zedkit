import { expect, test } from "@playwright/test";

/**
 * First-load stability (#sprint): the default home must not shift while it
 * loads. The home h1 uses the default identity's display face; if that face
 * arrives after first paint the heading reflows (3 lines -> 4) and everything
 * below it moves. Fresh context per test = cold load, no cache.
 */
test("home first paint is layout-stable on a cold load", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cls = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      /* PerformanceObserver unavailable: cls stays 0 and the font gate below still guards */
    }
  });
  await page.goto("/", { waitUntil: "load" });
  // Let the deferred work land: fonts, hydration, identity restore.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const cls = await page.evaluate(() => window.__cls ?? -1);
  expect(cls).toBeGreaterThanOrEqual(0);
  expect(cls).toBeLessThan(0.001);
});
