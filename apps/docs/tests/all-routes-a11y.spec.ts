import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { A11Y_AXE_EXCLUDES } from "./a11y-exceptions.mjs";
import { gotoStaticRoute } from "./goto-static-route.js";
import { routesForSweep } from "./published-routes.js";

/**
 * Axe on touched (or all) published routes, DoD v2 widths × light/dark. The
 * route list comes from the sitemap, then `DOCS_ROUTES`. Serious and critical
 * violations fail; the documented exclude list is the only escape hatch.
 *
 * One Playwright test per route so `fullyParallel` + `DOCS_E2E_SHARD` can
 * balance the sweep across runners.
 */
const VIEWS = [
  { width: 375, height: 800, theme: "light" },
  { width: 375, height: 800, theme: "dark" },
  { width: 809, height: 900, theme: "light" },
  { width: 809, height: 900, theme: "dark" },
  { width: 1440, height: 900, theme: "light" },
  { width: 1440, height: 900, theme: "dark" },
] as const;

const routes = routesForSweep();

test.describe.configure({ mode: "parallel" });

for (const route of routes) {
  test(`${route} passes axe at phone, tablet and desktop width, light and dark`, async ({ page }) => {
    const problems: string[] = [];
    // Axe reads colours mid-fade otherwise: scroll scenes animate opacity on entry.
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const view of VIEWS) {
      await page.setViewportSize({ width: view.width, height: view.height });
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), view.theme);
      await gotoStaticRoute(page, route);
      // The docs header label cross-fades when scroll-spy settles; let every transition end before reading colours.
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
      );
      let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
      if (A11Y_AXE_EXCLUDES) builder = builder.exclude(A11Y_AXE_EXCLUDES);
      const { violations } = await builder.analyze();
      for (const violation of violations) {
        if (violation.impact !== "serious" && violation.impact !== "critical") continue;
        const where = violation.nodes[0]?.target.join(" ").slice(0, 90);
        problems.push(`${route} @${view.width}/${view.theme}: ${violation.id} (${violation.nodes.length}) ${where}`);
      }
    }
    expect(problems).toEqual([]);
  });
}
