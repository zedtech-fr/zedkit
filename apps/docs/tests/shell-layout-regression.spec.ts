import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const DESKTOP_WIDTHS = [1280, 1440] as const;

for (const width of DESKTOP_WIDTHS) {
  test(`header search clears theme toggle at ${width}px light`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => {
      const search = document.querySelector("#nd-nav button[class*='max-w']");
      const toggle = document.querySelector("[data-theme-toggle]");
      if (!search || !toggle) return null;
      const s = search.getBoundingClientRect();
      const t = toggle.getBoundingClientRect();
      const overlap = s.left < t.right && s.right > t.left && s.top < t.bottom && s.bottom > t.top;
      return {
        gap: t.left - s.right,
        overlap,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.overlap).toBe(false);
    expect(layout!.gap).toBeGreaterThanOrEqual(8);
  });

  test(`catalog Results heading aligns with Filters at ${width}px light`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Filters", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Results", level: 2 })).toBeVisible();

    const tops = await page.evaluate(() => {
      const filters = document.querySelector("#catalog-filters-heading");
      const results = document.querySelector("#catalog-results-heading");
      const f = filters?.getBoundingClientRect();
      const r = results?.getBoundingClientRect();
      return f && r ? Math.abs(f.left - r.left) : Number.NaN;
    });
    expect(tops).toBeLessThanOrEqual(2);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`home hero admin demo shows table and detail at 390px ${theme}`, async ({ page }) => {
    await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const card = page.locator("[data-home-dashboard-card]");
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole("heading", { name: "Project apps", level: 2 })).toBeVisible();
    await expect(card.locator("table")).toBeVisible();
    await expect(card.getByRole("columnheader", { name: "Region" })).toBeVisible();

    const preview = page.locator("[data-home-hero-preview]");

    const scrollTargetIntoPreview = async (selector: string) =>
      preview.evaluate(
        (el, sel) => {
          const target = document.querySelector(sel);
          if (!target) return false;
          const delta = target.getBoundingClientRect().top - el.getBoundingClientRect().top;
          el.scrollTop += delta;
          const pr = el.getBoundingClientRect();
          const tr = target.getBoundingClientRect();
          return tr.top >= pr.top - 2 && tr.bottom <= pr.bottom + 2;
        },
        selector,
      );

    expect(await scrollTargetIntoPreview("[data-home-dashboard-card] table")).toBe(true);
    expect(await scrollTargetIntoPreview("[data-home-dashboard-card] button[aria-pressed]")).toBe(
      true,
    );

    const visible = await page.evaluate(() => {
      const previewEl = document.querySelector("[data-home-hero-preview]");
      if (!previewEl) return { ok: false };
      const previewStyle = getComputedStyle(previewEl);
      const hiddenClip =
        previewStyle.overflowY === "hidden" ||
        previewStyle.overflow === "hidden" ||
        previewStyle.overflowX === "hidden";
      return { ok: !hiddenClip, hiddenClip };
    });
    expect(visible, JSON.stringify(visible)).toMatchObject({ ok: true });
  });
}

test("install code on a docs page scrolls horizontally with a focusable region", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/docs/ui/slide-in-a-drawer-panel`, { waitUntil: "networkidle" });
  const install = page.locator("#install-or-copy figure.shiki").first();
  await install.scrollIntoViewIfNeeded();
  await expect(install).toBeVisible();
  const metrics = await install.evaluate((figure) => {
    const region = figure.querySelector('[role="region"]');
    const pre = figure.querySelector("pre");
    if (!region || !pre) return { ok: false };
    const style = getComputedStyle(region);
    const mask = style.maskImage || style.webkitMaskImage || "";
    const hasEdgeAffordance = mask.includes("gradient");
    const needsHorizontalScroll = pre.scrollWidth > region.clientWidth + 1;
    const scrolls = region.scrollWidth > region.clientWidth;
    return {
      ok:
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        region.getAttribute("tabindex") === "0" &&
        hasEdgeAffordance &&
        (!needsHorizontalScroll || scrolls),
      overflowX: style.overflowX,
      scrolls,
      needsHorizontalScroll,
      hasEdgeAffordance,
    };
  });
  expect(metrics, JSON.stringify(metrics)).toMatchObject({ ok: true });
});

for (const width of [1280, 1600] as const) {
  test(`home band spacing and width stay consistent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => {
      const secondary = document.querySelector("[data-home-secondary-actions]");
      const useCases = document.getElementById("use-cases");
      const getStarted = document.getElementById("get-started");
      const useInner = useCases?.querySelector("[data-slot='container']");
      const startInner = getStarted?.querySelector("[data-slot='container']");
      if (!secondary || !useCases || !getStarted || !useInner || !startInner) return null;

      const sectionMd = getComputedStyle(document.documentElement)
        .getPropertyValue("--zk-section-md")
        .trim();
      const probe = document.createElement("div");
      probe.style.paddingTop = sectionMd || "var(--zk-section-md)";
      document.body.appendChild(probe);
      const sectionMdPx = parseFloat(getComputedStyle(probe).paddingTop);
      probe.remove();

      const gapAfterSecondary = useCases.getBoundingClientRect().top - secondary.getBoundingClientRect().bottom;
      const gapBeforeGetStarted =
        getStarted.getBoundingClientRect().top - useCases.getBoundingClientRect().bottom;
      const useBox = useInner.getBoundingClientRect();
      const startBox = startInner.getBoundingClientRect();

      return {
        gapAfterSecondary,
        gapBeforeGetStarted,
        sectionMdPx,
        widthDelta: Math.abs(useBox.width - startBox.width),
        leftDelta: Math.abs(useBox.left - startBox.left),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.widthDelta).toBeLessThanOrEqual(2);
    expect(metrics!.leftDelta).toBeLessThanOrEqual(2);
    expect(metrics!.gapAfterSecondary).toBeLessThanOrEqual(metrics!.sectionMdPx * 1.35);
    expect(metrics!.gapBeforeGetStarted).toBeLessThanOrEqual(metrics!.sectionMdPx * 1.35);
  });
}
