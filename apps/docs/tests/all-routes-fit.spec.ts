import { expect, test } from "@playwright/test";

import { clippedTextHits } from "../scripts/clipped-text.mjs";
import { gotoStaticRoute } from "./goto-static-route.js";
import { publishedRoutes, routesForSweep } from "./published-routes.js";

/**
 * Touched (or all) published routes, DoD v2 widths × light/dark: no sideways
 * page scroll, no clipped text, no runtime errors, one h1, and every image
 * has an alt. The route list comes from the sitemap, then `DOCS_ROUTES`.
 *
 * One Playwright test per route so `fullyParallel` + `DOCS_E2E_SHARD` can
 * balance the sweep across runners.
 */
const WIDTHS = [375, 809, 1440] as const;
const THEMES = ["light", "dark"] as const;

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

    for (const theme of THEMES) {
      await page.addInitScript((nextTheme) => localStorage.setItem("theme", nextTheme), theme);
      await page.setViewportSize({ width: WIDTHS[0], height: 900 });
      const response = await gotoStaticRoute(page, route);
      if (!response || response.status() !== 200) {
        problems.push(`${route} ${theme}: status ${response?.status()}`);
        continue;
      }
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (sideways > 1) problems.push(`${route} @${width}/${theme}: ${sideways}px sideways scroll`);
        const metrics = await page.evaluate(() =>
          [...document.querySelectorAll("*")].map((node) => {
            const style = getComputedStyle(node);
            return {
              tag: node.tagName,
              className: typeof node.className === "string" ? node.className : "",
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
          problems.push(`${route} @${width}/${theme}: clipped ${hit.kind} <${hit.tag}>`);
        }
      }
      const facts = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        noAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
      }));
      if (facts.h1 !== 1) problems.push(`${route} ${theme}: ${facts.h1} h1`);
      if (facts.noAlt > 0) problems.push(`${route} ${theme}: ${facts.noAlt} images without alt`);
    }
    if (errors.length > 0) problems.push(`${route}: ${errors.join(" | ")}`);
    expect(problems).toEqual([]);
  });
}
