import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

import { A11Y_AXE_EXCLUDES } from "./a11y-exceptions.mjs";

export { A11Y_AXE_EXCLUDES };

export const A11Y_GATE_RULES = [
  "button-name",
  "link-name",
  "color-contrast",
  "aria-progressbar-name",
  "aria-valid-attr",
  "scrollable-region-focusable",
  "heading-order",
  "document-title",
  "html-has-lang",
] as const;

export async function assertA11yGate(page: Page, selector = "body"): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .exclude(A11Y_AXE_EXCLUDES)
    .withRules([...A11Y_GATE_RULES])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export async function readComputedContrast(
  page: Page,
  locator: ReturnType<Page["locator"]>,
): Promise<number> {
  return locator.evaluate((el) => {
    const parse = (css: string): [number, number, number] | null => {
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    };
    const isTransparent = (css: string) => css === "transparent" || css === "rgba(0, 0, 0, 0)";
    const probe = el.cloneNode(true) as HTMLElement;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    document.body.appendChild(probe);
    const style = getComputedStyle(probe);
    const fgRgb = parse(style.color);
    const bgRgb = parse(style.backgroundColor);
    probe.remove();
    if (!fgRgb || !bgRgb || isTransparent(style.backgroundColor)) {
      return 0;
    }
    const lum = (rgb: [number, number, number]) => {
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    };
    const l1 = lum(fgRgb);
    const l2 = lum(bgRgb);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  });
}
