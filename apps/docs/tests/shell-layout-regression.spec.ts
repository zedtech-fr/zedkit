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
      const toggleLeft = toggle.getBoundingClientRect().left;
      const nodes = [search, ...search.querySelectorAll("*")];
      let maxRight = Number.NEGATIVE_INFINITY;
      const offenders: { tag: string; right: number }[] = [];
      for (const node of nodes) {
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        maxRight = Math.max(maxRight, r.right);
        if (r.right > toggleLeft + 0.5) {
          offenders.push({ tag: node.tagName.toLowerCase(), right: r.right });
        }
      }
      return {
        gap: toggleLeft - maxRight,
        offenders,
        toggleLeft,
        maxRight,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.offenders, JSON.stringify(layout!.offenders)).toEqual([]);
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
    await preview.scrollIntoViewIfNeeded();

    await expect(card.getByRole("button", { name: "Edit console" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Delete console" })).toBeVisible();
    await expect(card.locator("table")).toBeVisible();

    const visible = await preview.evaluate((el) => {
      const style = getComputedStyle(el);
      const hiddenClip =
        style.overflowY === "hidden" ||
        style.overflow === "hidden" ||
        style.overflowX === "hidden";
      const sizedToContent = el.clientHeight + 2 >= el.scrollHeight;
      return { ok: !hiddenClip && sizedToContent, hiddenClip, sizedToContent };
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

test("home get-started install commands scroll horizontally at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/#get-started`, { waitUntil: "networkidle" });
  const block = page.locator("#get-started [data-install-command]").nth(1);
  await block.scrollIntoViewIfNeeded();
  await expect(block).toBeVisible();
  const metrics = await block.evaluate((root) => {
    const region = root.querySelector('[role="region"]');
    const pre = root.querySelector("pre");
    if (!region || !pre) return { ok: false, reason: "missing region or pre" };
    const style = getComputedStyle(region);
    const mask = style.maskImage || style.webkitMaskImage || "";
    return {
      ok:
        pre.scrollWidth > region.clientWidth + 1 &&
        region.scrollWidth > region.clientWidth &&
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        region.getAttribute("tabindex") === "0" &&
        mask.includes("gradient"),
      preScrollWidth: pre.scrollWidth,
      regionClientWidth: region.clientWidth,
      overflowX: style.overflowX,
    };
  });
  expect(metrics, JSON.stringify(metrics)).toMatchObject({ ok: true });
  expect(metrics!.preScrollWidth!).toBeGreaterThan(273);
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
