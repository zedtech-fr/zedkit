import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { looksFromEnv } from "../scripts/docs-routes-env.mjs";
import { A11Y_AXE_EXCLUDES } from "./a11y-exceptions.mjs";
import { gotoStaticRoute } from "./goto-static-route.js";
import { persistDocsSiteLook } from "./identity-helpers.js";
import { routesForSweep } from "./published-routes.js";

/**
 * Load-time axe on touched (or all) published routes, DoD v2 widths ×
 * light/dark. Serious and critical violations fail; the documented exclude
 * list is the only escape hatch. Keyboard, motion and interaction stay in
 * the sampled `smoke` / `e2e` suites. The route list comes from the
 * sitemap, then `DOCS_ROUTES`. `DOCS_LOOKS` rotates shipped looks; unset or
 * blank keeps the default site look.
 *
 * One Playwright test per route (× look) so `fullyParallel` + `DOCS_E2E_SHARD`
 * can balance the sweep across runners.
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
const looks = looksFromEnv(process.env.DOCS_LOOKS);

test.describe.configure({ mode: "parallel" });

for (const route of routes) {
  for (const look of looks) {
    const lookSuffix = look ? ` look=${look}` : "";
    test(`${route}${lookSuffix} passes axe at phone, tablet and desktop width, light and dark`, async ({ page }) => {
      const problems: string[] = [];
      // Axe reads colours mid-fade otherwise: scroll scenes animate opacity on entry.
      await page.emulateMedia({ reducedMotion: "reduce" });

      for (const view of VIEWS) {
        const cell = `${route}${lookSuffix} @${view.width}/${view.theme}`;
        await page.setViewportSize({ width: view.width, height: view.height });
        if (look) {
          await persistDocsSiteLook(page, look, view.theme);
        } else {
          await page.addInitScript((theme) => localStorage.setItem("theme", theme), view.theme);
        }
        await gotoStaticRoute(page, route);
        // View timelines and infinite loops never settle; cap so / cannot hang.
        await page.evaluate(
          () =>
            Promise.race([
              Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
              new Promise((resolve) => {
                setTimeout(resolve, 2000);
              }),
            ]),
        );
        const wantDark = view.theme === "dark";
        const themeApplied = await page
          .waitForFunction(
            ({ want, id }) => {
              const root = document.documentElement;
              if (root.classList.contains("dark") !== want) return false;
              if (id && root.getAttribute("data-identity") !== id) return false;
              return true;
            },
            { want: wantDark, id: look },
            { timeout: 3000 },
          )
          .then(
            () => true,
            () => false,
          );
        if (!themeApplied) {
          const facts = await page.evaluate(() => ({
            dark: document.documentElement.classList.contains("dark"),
            identity: document.documentElement.getAttribute("data-identity"),
          }));
          problems.push(`${cell}: html.dark=${facts.dark} data-identity=${facts.identity}`);
        }
        let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
        if (A11Y_AXE_EXCLUDES) builder = builder.exclude(A11Y_AXE_EXCLUDES);
        const { violations } = await builder.analyze();
        for (const violation of violations) {
          if (violation.impact !== "serious" && violation.impact !== "critical") continue;
          const where = violation.nodes[0]?.target.join(" ").slice(0, 90);
          problems.push(`${cell}: ${violation.id} (${violation.nodes.length}) ${where}`);
        }
      }
      expect(problems).toEqual([]);
    });
  }
}
