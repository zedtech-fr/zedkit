import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const WIDTHS = [390, 768, 1280] as const;

const SECTION_IDS = ["entry-points", "scenarios", "proofs", "components"];

test.describe("home layout rhythm (#387)", () => {
  for (const width of WIDTHS) {
    test(`no overflow and aligned sections at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE, { waitUntil: "networkidle" });

      const metrics = await page.evaluate((sectionIds) => {
        const root = document.querySelector("#home-page");
        const viewportWidth = document.documentElement.clientWidth;
        const scrollWidth = root?.scrollWidth ?? document.documentElement.scrollWidth;

        const cards = document.querySelectorAll("#scenarios .rounded-xl.border");
        const overflows = [...cards].filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.right > viewportWidth + 0.5 || rect.left < -0.5;
        });

        const sectionGaps: number[] = [];
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => el !== null);
        for (let i = 1; i < sections.length; i++) {
          const prev = sections[i - 1].getBoundingClientRect();
          const next = sections[i].getBoundingClientRect();
          sectionGaps.push(next.top - prev.bottom);
        }

        const scenarioPads = [...document.querySelectorAll("#scenarios .rounded-xl.border")].map((card) => {
          const header = card.querySelector(":scope > div");
          return header ? getComputedStyle(header).paddingLeft : "";
        });
        const entryPads = [...document.querySelectorAll("#entry-points .rounded-xl.border")].map((card) => {
          const header = card.querySelector(":scope > div");
          return header ? getComputedStyle(header).paddingLeft : "";
        });

        return {
          scrollWidth,
          viewportWidth,
          overflowCount: overflows.length,
          sectionGaps,
          scenarioPads,
          entryPads,
        };
      }, SECTION_IDS);

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.overflowCount).toBe(0);

      expect(metrics.sectionGaps.length).toBeGreaterThan(1);
      const firstGap = metrics.sectionGaps[0];
      for (const gap of metrics.sectionGaps) {
        expect(Math.abs(gap - firstGap)).toBeLessThan(2);
      }

      expect(metrics.scenarioPads.length).toBeGreaterThan(0);
      const pad = metrics.scenarioPads[0];
      for (const p of metrics.scenarioPads) {
        expect(p).toBe(pad);
      }
      expect(metrics.entryPads[0]).toBe(pad);
    });
  }
});
