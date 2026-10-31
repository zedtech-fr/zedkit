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
          .filter((el): el is HTMLElement => el !== null && el.offsetHeight > 0);
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

      if (width >= 768) {
        expect(metrics.sectionGaps.length).toBeGreaterThan(0);
        if (metrics.scenarioPads.length > 0) {
          const firstGap = metrics.sectionGaps[0];
          for (const gap of metrics.sectionGaps) {
            expect(Math.abs(gap - firstGap)).toBeLessThan(2);
          }
          const pad = metrics.scenarioPads[0];
          for (const p of metrics.scenarioPads) {
            expect(p).toBe(pad);
          }
          expect(metrics.entryPads[0]).toBe(pad);
        }
      }
    });
  }
});

test.describe("home bands (#1025)", () => {
  test("sections bleed edge to edge with content capped at wide on 2560px", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => {
      const rect = (el: Element | null | undefined) => {
        const r = el?.getBoundingClientRect();
        return r ? { left: r.left, right: r.right, width: r.width } : null;
      };
      const section = document.getElementById("components");
      return {
        viewportWidth: document.documentElement.clientWidth,
        section: rect(section),
        inner: rect(section?.querySelector(":scope > div")),
        heading: rect(document.querySelector("#home-page h1")),
      };
    });

    // The band itself runs edge to edge.
    expect(metrics.section).not.toBeNull();
    expect(metrics.section!.left).toBeLessThanOrEqual(1);
    expect(metrics.section!.right).toBeGreaterThanOrEqual(metrics.viewportWidth - 1);

    // Its content is capped at the wide measure (90rem = 1440px at the stock
    // root size) and centered inside the band.
    expect(metrics.inner).not.toBeNull();
    expect(metrics.inner!.width).toBeGreaterThan(1200);
    expect(metrics.inner!.width).toBeLessThanOrEqual(1442);
    expect(Math.abs(metrics.inner!.left - (metrics.viewportWidth - metrics.inner!.right))).toBeLessThan(2);

    // The hero is no longer trapped in the old 1024px shell (its heading
    // started ~768px in at this width before the bands).
    expect(metrics.heading).not.toBeNull();
    expect(metrics.heading!.left).toBeLessThan((metrics.viewportWidth - 1440) / 2 + 48);
  });

  // Regression guard: fumadocs' prebuilt CSS re-emits some utilities later
  // in the shared utilities layer, so a home grid class it also defines can
  // shadow this app's higher breakpoint step on the same property. Assert
  // the rendered track counts, not just the class names.
  test("card grids reach their wide column counts at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const tracks = await page.evaluate(() => {
      const count = (id: string) => {
        const grid = document.getElementById(id)?.querySelector(".grid");
        return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
      };
      return {
        entryPoints: count("entry-points"),
        scenarios: count("scenarios"),
        components: count("components"),
      };
    });

    expect(tracks.entryPoints).toBe(4);
    expect(tracks.scenarios).toBe(3);
    expect(tracks.components).toBe(3);
  });
});

test.describe("docs shell wide (#1064)", () => {
  const DOCS_PAGE = `${BASE}/docs/ui/trigger-actions-with-buttons`;

  async function docsGeometry(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const rect = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right) };
      };
      return {
        viewportWidth: window.innerWidth,
        article: rect("#nd-page"),
        main: rect("[data-layout-main]"),
        toc: rect("#nd-toc"),
        preview: rect("[data-component-preview]"),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
  }

  test("docs cluster widens past 1920px: article and previews take a share", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.goto(DOCS_PAGE, { waitUntil: "networkidle" });
    const m = await docsGeometry(page);
    expect(m.article).not.toBeNull();
    expect(m.article!.width).toBeGreaterThanOrEqual(1050);
    expect(m.main!.width).toBeGreaterThanOrEqual(1200);
    expect(m.preview!.width).toBeGreaterThanOrEqual(1000);
    // The cluster stays centered: the flexible column left of the sidebar
    // (268px slot) mirrors the dead space after the TOC.
    expect(Math.abs(m.main!.left - 268 - (m.viewportWidth - m.toc!.right))).toBeLessThanOrEqual(2);
    expect(m.overflow).toBeLessThanOrEqual(1);
  });

  test("docs cluster is untouched below 1920px and steps at the boundary", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(DOCS_PAGE, { waitUntil: "networkidle" });
    expect((await docsGeometry(page)).article!.width).toBeLessThanOrEqual(902);
    await page.setViewportSize({ width: 1919, height: 1000 });
    expect((await docsGeometry(page)).article!.width).toBeLessThanOrEqual(902);
    await page.setViewportSize({ width: 1920, height: 1000 });
    const m = await docsGeometry(page);
    expect(m.article!.width).toBeGreaterThanOrEqual(1050);
    expect(m.overflow).toBeLessThanOrEqual(1);
  });
});
