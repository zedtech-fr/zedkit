import { expect, test } from "@playwright/test";

import { clippedTextHits } from "../scripts/clipped-text.mjs";
import { looksFromEnv } from "../scripts/docs-routes-env.mjs";
import { gotoStaticRoute } from "./goto-static-route.js";
import { persistDocsSiteLook } from "./identity-helpers.js";
import { publishedRoutes, routesForSweep } from "./published-routes.js";

/**
 * Load-time static structure on touched (or all) published routes, DoD v2
 * widths × light/dark: no sideways page scroll, no clipped text, no runtime
 * errors, one h1, and every image has an alt. Keyboard, motion and
 * interaction stay in the sampled `smoke` / `e2e` suites. The route list
 * comes from the sitemap, then `DOCS_ROUTES`. `DOCS_LOOKS` rotates shipped
 * looks; unset or blank keeps the default site look.
 *
 * One Playwright test per route (× look) so `fullyParallel` + `DOCS_E2E_SHARD`
 * can balance the sweep across runners.
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
const looks = looksFromEnv(process.env.DOCS_LOOKS);

test.describe.configure({ mode: "parallel" });

test("published sitemap lists more than 100 routes", () => {
  expect(sitemapRoutes.length).toBeGreaterThan(100);
});

for (const route of routes) {
  for (const look of looks) {
    const lookSuffix = look ? ` look=${look}` : "";
    test(`${route}${lookSuffix} fits every width and stays error-free`, async ({ page }) => {
      const problems: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error" && !/Failed to load resource.*(favicon|_next\/image)/.test(message.text())) {
          errors.push(message.text().slice(0, 160));
        }
      });

      for (const view of VIEWS) {
        const cell = `${route}${lookSuffix} @${view.width}/${view.theme}`;
        await page.setViewportSize({ width: view.width, height: view.height });
        if (look) {
          await persistDocsSiteLook(page, look, view.theme);
        } else {
          await page.addInitScript((theme) => localStorage.setItem("theme", theme), view.theme);
        }
        const response = await gotoStaticRoute(page, route);
        if (!response || response.status() !== 200) {
          problems.push(`${cell}: status ${response?.status()}`);
          continue;
        }
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
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (sideways > 1) problems.push(`${cell}: ${sideways}px sideways scroll`);
        // Skip 1×1 and non-overflowing nodes before getComputedStyle / text.
        // Walking textContent on every * is quadratic and times out on /.
        const metrics = await page.evaluate(() => {
          const out = [];
          for (const node of document.querySelectorAll("*")) {
            const clientWidth = node.clientWidth;
            const clientHeight = node.clientHeight;
            if (clientWidth <= 1 && clientHeight <= 1) continue;
            const scrollWidth = node.scrollWidth;
            const scrollHeight = node.scrollHeight;
            if (scrollWidth <= clientWidth + 1 && scrollHeight <= clientHeight + 1) continue;
            const style = getComputedStyle(node);
            let text = "";
            for (const child of node.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) text += child.nodeValue ?? "";
            }
            out.push({
              tag: node.tagName,
              className: typeof node.className === "string" ? node.className : "",
              text: text.replace(/\s+/g, " ").trim().slice(0, 40),
              overflowX: style.overflowX,
              overflowY: style.overflowY,
              textOverflow: style.textOverflow,
              lineClamp: style.getPropertyValue("-webkit-line-clamp") || style.getPropertyValue("line-clamp"),
              clip: style.clip,
              clipPath: style.clipPath,
              scrollWidth,
              clientWidth,
              scrollHeight,
              clientHeight,
              allowClip: node.hasAttribute("data-allow-clip"),
              scrollViewport: node.hasAttribute("data-radix-scroll-area-viewport"),
            });
          }
          return out;
        });
        for (const hit of clippedTextHits(metrics)) {
          const where = hit.locator ? ` ${hit.locator}` : "";
          problems.push(`${cell}: clipped ${hit.kind} <${hit.tag}>${where}`);
        }
        const facts = await page.evaluate(() => ({
          h1: document.querySelectorAll("h1").length,
          noAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
        }));
        if (facts.h1 !== 1) problems.push(`${cell}: ${facts.h1} h1`);
        if (facts.noAlt > 0) problems.push(`${cell}: ${facts.noAlt} images without alt`);
      }
      if (errors.length > 0) problems.push(`${route}${lookSuffix}: ${errors.join(" | ")}`);
      expect(problems).toEqual([]);
    });
  }
}
