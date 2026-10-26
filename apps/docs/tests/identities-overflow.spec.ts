import { expect, test } from "@playwright/test";

/**
 * Every identity changes spacing, type scale and shape tokens. None of
 * them may push content past the right edge of a phone screen: the page
 * and every block inside it must fit the viewport at 390px and 360px.
 */
const IDENTITIES = ["soft", "retro-square", "studio", "deep", "luxe"] as const;
const WIDTHS = [390, 360] as const;
const PAGES = ["/", "/docs/identities-and-theming", "/docs/ui/theme-an-admin-app-dark-light-included"] as const;

/** Blocks that scroll on purpose (code, wide tables) may extend past the viewport. */
const SCROLLERS = "pre, figure, table, [data-scroll], .overflow-x-auto, .overflow-auto";

for (const identity of IDENTITIES) {
  for (const width of WIDTHS) {
    test.describe(`${identity} at ${width}px`, () => {
      test.use({ viewport: { width, height: 800 }, reducedMotion: "reduce" });

      for (const path of PAGES) {
        test(`no horizontal overflow on ${path}`, async ({ page }) => {
          await page.addInitScript((id) => {
            localStorage.setItem("zk-identity", id);
            localStorage.setItem("zk-identity-tour", "1");
          }, identity);
          await page.goto(path, { waitUntil: "networkidle" });

          const report = await page.evaluate((scrollers) => {
            const viewport = document.documentElement.clientWidth;
            const offenders: string[] = [];
            for (const element of document.querySelectorAll("body *")) {
              const box = element.getBoundingClientRect();
              if (box.width === 0 || box.right <= viewport + 1 || element.closest(scrollers)) continue;
              offenders.push(`${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)} right=${Math.round(box.right)}`);
              if (offenders.length === 5) break;
            }
            return {
              viewport,
              html: document.documentElement.scrollWidth,
              body: document.body.scrollWidth,
              offenders,
            };
          }, SCROLLERS);

          expect(report.html, "html scrollWidth").toBeLessThanOrEqual(report.viewport);
          expect(report.body, "body scrollWidth").toBeLessThanOrEqual(report.viewport);
          expect(report.offenders, "elements past the right edge").toEqual([]);
        });
      }
    });
  }
}
