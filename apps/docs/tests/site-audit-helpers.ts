import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const MOBILE_WIDTH = 375;

/**
 * Baseline axe on `main` (#300 harness). Contrast AA tightens when the home
 * refresh lands (#286); fumadocs chrome duplicates are out of scope here.
 */
const AXE_BASELINE_RULES_OFF = [
  "landmark-unique",
  "region",
  "landmark-one-main",
  "color-contrast",
] as const;

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  await page.setViewportSize({ width: MOBILE_WIDTH, height: 844 });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
}

export async function assertAxeOnMain(page: Page, extraRulesOff: string[] = []): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include("main")
    .disableRules([...AXE_BASELINE_RULES_OFF, ...extraRulesOff])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

export async function assertNoNestedInteractive(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withRules(["nested-interactive"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

export async function assertUniqueLinkNames(page: Page): Promise<void> {
  const names = await page.getByRole("link").evaluateAll((nodes) =>
    nodes.map((node) => {
      const name = node.textContent?.trim() ?? "";
      const aria = node.getAttribute("aria-label")?.trim() ?? "";
      return aria || name;
    }).filter((n) => n.length > 0),
  );
  const seen = new Map<string, number>();
  for (const name of names) {
    seen.set(name, (seen.get(name) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
  expect(duplicates, `duplicate link accessible names: ${JSON.stringify(duplicates)}`).toEqual([]);
}

export async function assertInternalLinksResolve(page: Page, origin: string): Promise<void> {
  const hrefs = await page.locator("main a[href]").evaluateAll((anchors) =>
    anchors
      .map((a) => a.getAttribute("href"))
      .filter((h): h is string => typeof h === "string" && h.length > 0),
  );
  const internal = hrefs
    .filter((h) => h.startsWith("/") && !h.startsWith("//"))
    .slice(0, 24);
  for (const href of internal) {
    const res = await page.request.get(`${origin}${href}`);
    expect(res.status(), href).toBeLessThan(400);
  }
}

/** Tab until focus lands on a link or button inside `main`. */
export async function assertKeyboardReachesFirstMainCta(page: Page): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const inMainCta = await page.evaluate(() => {
      const main = document.querySelector("main");
      const el = document.activeElement;
      if (!main || !el || !main.contains(el)) return false;
      const tag = el.tagName;
      return tag === "A" || tag === "BUTTON" || el.getAttribute("role") === "button";
    });
    if (inMainCta) return;
    await page.keyboard.press("Tab");
  }
  expect(false, "keyboard path did not reach a main CTA").toBe(true);
}
