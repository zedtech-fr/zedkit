import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Finish guards for the docs site: layout stability, theme-color, motion
 * caps, touch and hover guards, contrast (code included) in every
 * built-in identity, and badge links. Relative paths: the config baseURL
 * decides the port.
 */
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const THEMES = ["light", "dark"] as const;

/** Picks an identity and a colour mode before the page loads, like a returning visitor. */
async function visitAs(page: Page, identity: string, theme: string) {
  await page.addInitScript(
    ([id, mode]) => {
      localStorage.setItem("zk-identity", id!);
      localStorage.setItem("theme", mode!);
    },
    [identity, theme],
  );
}

test("home layout shift stays under 0.05", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let value = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) value += entry.value;
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        window.setTimeout(() => {
          observer.disconnect();
          resolve(value);
        }, 2000);
      }),
  );
  expect(cls).toBeLessThan(0.05);
});

test("theme-color meta is present", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", /.+/);
});

for (const identity of IDENTITIES) {
  test(`interactive transitions stay within 300ms (${identity})`, async ({ page }) => {
    await visitAs(page, identity, "light");
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    const tooSlow = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("main *")) {
        for (const part of getComputedStyle(el).transitionDuration.split(",")) {
          const ms = part.includes("ms") ? parseFloat(part) : parseFloat(part) * 1000;
          if (Number.isFinite(ms) && ms > 300) found.push(`${el.tagName.toLowerCase()} ${ms}ms`);
        }
      }
      return found.slice(0, 5);
    });
    expect(tooSlow).toEqual([]);
  });
}

test("stylesheets carry the coarse-pointer and hover guards", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const css = await page.evaluate(async () => {
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')];
    const files = await Promise.all(links.map((link) => fetch(link.href).then((res) => res.text())));
    const inline = [...document.querySelectorAll("style")].map((style) => style.textContent ?? "");
    return [...files, ...inline].join("\n");
  });
  expect(css).toMatch(/pointer:\s*coarse/);
  expect(css).toMatch(/hover:\s*hover/);
});

for (const identity of IDENTITIES) {
  for (const theme of THEMES) {
    test(`axe contrast on a docs page with code (${identity}, ${theme})`, async ({ page }) => {
      await visitAs(page, identity, theme);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
      if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.locator("main pre").first()).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include("main")
        .withRules(["color-contrast"])
        .exclude('[role="tab"][aria-selected="false"]')
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}

test("phone: maturity and badge links meet the 44px target", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/ui/build-validated-forms-with-labels-errors-and-pending-state", {
    waitUntil: "networkidle",
  });
  const { checked, small } = await page.evaluate(() => {
    const found: string[] = [];
    let count = 0;
    for (const el of document.querySelectorAll("main a.px-badge-inline, main a[href*='maturity']")) {
      count += 1;
      const box = el.getBoundingClientRect();
      const after = getComputedStyle(el, "::after");
      const height = Math.max(box.height, parseFloat(after.minHeight) || 0);
      if (height < 43.5) found.push(`${(el.textContent ?? "").trim()} ${Math.round(height)}px`);
    }
    return { checked: count, small: found };
  });
  expect(checked).toBeGreaterThan(0);
  expect(small).toEqual([]);
});

for (const identity of IDENTITIES) {
  test(`maturity badge link has no underline (${identity}, dark)`, async ({ page }) => {
    await visitAs(page, identity, "dark");
    await page.goto("/docs/ui/stamp-data-with-its-age/", { waitUntil: "networkidle" });
    const badge = page
      .locator("main a")
      .filter({ hasText: /^alpha$/i })
      .first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS("text-decoration-line", "none");
  });
}
