import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test("home CLS stays under 0.05", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const cls = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let value = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "layout-shift" && !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            value += (entry as PerformanceEntry & { value: number }).value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      window.setTimeout(() => {
        observer.disconnect();
        resolve(value);
      }, 2000);
    });
  });
  expect(cls).toBeLessThan(0.05);
});

test("theme-color meta is present", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const metas = page.locator('meta[name="theme-color"]');
  await expect(metas.first()).toHaveAttribute("content", /.+/);
});

test("interactive transitions stay within 300ms", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  const tooSlow = await page.evaluate(() => {
    const found: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("main *")) {
      const style = getComputedStyle(el);
      for (const prop of style.transitionDuration.split(",")) {
        const ms = prop.includes("ms") ? parseFloat(prop) : parseFloat(prop) * 1000;
        if (Number.isFinite(ms) && ms > 300) found.push(`${el.tagName} ${ms}ms`);
      }
    }
    return found.slice(0, 5);
  });
  expect(tooSlow).toEqual([]);
});

test("docs shell exposes coarse-pointer and hover guards", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const css = await page.content();
  expect(css).toMatch(/pointer:\s*coarse/);
  expect(css).toMatch(/hover:\s*hover/);
});

for (const identity of IDENTITIES) {
  test(`axe contrast on ui docs (dark, ${identity})`, async ({ page }) => {
    await page.addInitScript((id) => {
      localStorage.setItem("zk-identity", id);
      localStorage.setItem("theme", "dark");
    }, identity);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/docs/ui/trigger-actions-with-buttons`, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    const scan = new AxeBuilder({ page })
      .include("main")
      .withRules(["color-contrast"])
      .exclude('[role="tab"][aria-selected="false"]');
    const results = await scan.analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("mobile doc links and badges meet 44px targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/docs/ui/call-out-a-notice-or-an-error-state`, { waitUntil: "networkidle" });
  const small = await page.evaluate(() => {
    const found: string[] = [];
    for (const el of document.querySelectorAll("main a.px-badge-inline, main a[href*='maturity']")) {
      const box = el.getBoundingClientRect();
      if (box.height < 43.5) found.push(`${(el.textContent ?? "").trim()} ${Math.round(box.height)}px`);
    }
    return found;
  });
  expect(small).toEqual([]);
});
