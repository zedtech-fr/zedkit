import { expect, test } from "@playwright/test";

import { clippedTextHits } from "../scripts/clipped-text.mjs";
import { gotoStaticRoute } from "./goto-static-route.js";
import { publishedRoutes, routesForSweep } from "./published-routes.js";

/**
 * Load-time static structure on touched (or all) published routes, DoD v2
 * widths × light/dark: no sideways page scroll, no clipped text, no runtime
 * errors, one h1, and every image has an alt. Keyboard, motion and
 * interaction stay in the sampled `smoke` / `e2e` suites. The route list
 * comes from the sitemap, then `DOCS_ROUTES`.
 *
 * One Playwright test per route so `fullyParallel` + `DOCS_E2E_SHARD` can
 * balance the sweep across runners.
 */
const VIEWS = [
  { width: 375, height: 900, theme: "light" },
  { width: 375, height: 900, theme: "dark" },
  { width: 809, height: 900, theme: "light" },
  { width: 809, height: 900, theme: "dark" },
  { width: 1440, height: 900, theme: "light" },
  { width: 1440, height: 900, theme: "dark" },
] as const;

const sitemapRoutes = publishedRoutes();
const routes = routesForSweep();

test.describe.configure({ mode: "parallel" });

test("published sitemap lists more than 100 routes", () => {
  expect(sitemapRoutes.length).toBeGreaterThan(100);
});

for (const route of routes) {
  test(`${route} fits every width and stays error-free`, async ({ page }) => {
    const problems: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error" && !/Failed to load resource.*(favicon|_next\/image)/.test(message.text())) {
        errors.push(message.text().slice(0, 160));
      }
    });

    for (const view of VIEWS) {
      await page.setViewportSize({ width: view.width, height: view.height });
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), view.theme);
      const response = await gotoStaticRoute(page, route);
      if (!response || response.status() !== 200) {
        problems.push(`${route} ${view.theme} @${view.width}: status ${response?.status()}`);
        continue;
      }
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
      );
      const wantDark = view.theme === "dark";
      const themeApplied = await page
        .waitForFunction((want) => document.documentElement.classList.contains("dark") === want, wantDark, {
          timeout: 3000,
        })
        .then(
          () => true,
          () => false,
        );
      if (!themeApplied) {
        const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        problems.push(`${route} @${view.width}/${view.theme}: html.dark=${dark}`);
      }
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (sideways > 1) problems.push(`${route} @${view.width}/${view.theme}: ${sideways}px sideways scroll`);
      const metrics = await page.evaluate(() =>
        [...document.querySelectorAll("*")].map((node) => {
          const style = getComputedStyle(node);
          return {
            tag: node.tagName,
            className: typeof node.className === "string" ? node.className : "",
            text: (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            textOverflow: style.textOverflow,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight,
            allowClip: node.hasAttribute("data-allow-clip"),
          };
        }),
      );
      for (const hit of clippedTextHits(metrics)) {
        const where = hit.locator ? ` ${hit.locator}` : "";
        problems.push(`${route} @${view.width}/${view.theme}: clipped ${hit.kind} <${hit.tag}>${where}`);
      }
      const facts = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        noAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
      }));
      if (facts.h1 !== 1) problems.push(`${route} @${view.width}/${view.theme}: ${facts.h1} h1`);
      if (facts.noAlt > 0) problems.push(`${route} @${view.width}/${view.theme}: ${facts.noAlt} images without alt`);
    }
    if (errors.length > 0) problems.push(`${route}: ${errors.join(" | ")}`);
    expect(problems).toEqual([]);
  });
}
