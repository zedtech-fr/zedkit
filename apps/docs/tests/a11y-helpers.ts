import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

import { A11Y_AXE_EXCLUDES } from "./a11y-exceptions.mjs";

export { A11Y_AXE_EXCLUDES };

/** Built-in kit identities exercised in docs visual/a11y matrices (ZK-15). */
export const DOCS_SHIPPED_IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
export type DocsShippedIdentity = (typeof DOCS_SHIPPED_IDENTITIES)[number];

const IDENTITY_SANS_SNIPPET: Record<DocsShippedIdentity, string> = {
  mist: "system-ui", // stock stack: mist is the unbranded baseline
  press: "Space Grotesk",
  tide: "Inter Variable",
  volt: "Geist",
  maison: "Jost Variable",
  glass: "Inter Variable",
};

/** Preview toolbar: pin identity + local light/dark, then assert scope tokens. */
export async function pinDemoLook(
  preview: Locator,
  identity: DocsShippedIdentity,
  mode: "light" | "dark",
): Promise<Locator> {
  await preview.scrollIntoViewIfNeeded();
  await preview.getByLabel("Style of this demo").selectOption(identity);
  await preview.getByRole("button", { name: mode === "light" ? "Light" : "Dark", exact: true }).click();
  const surface = preview.locator("[data-preview-surface]");
  await expect(surface).toHaveAttribute("data-identity", identity);
  await expect(surface).toHaveAttribute("data-identity-scope", "");
  await expect.poll(() => surface.evaluate((node) => node.classList.contains("dark"))).toBe(mode === "dark");
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const style = getComputedStyle(node);
        return (
          style.getPropertyValue("--primary").trim().length > 0 &&
          style.getPropertyValue("--background").trim().length > 0
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const sans = getComputedStyle(node).getPropertyValue("--font-sans");
        const probe = document.createElement("span");
        probe.style.fontFamily = sans;
        node.appendChild(probe);
        const family = getComputedStyle(probe).fontFamily;
        probe.remove();
        return family;
      }),
    )
    .toContain(IDENTITY_SANS_SNIPPET[identity]);
  return surface;
}

export async function assertFocusVisibleRing(button: Locator): Promise<void> {
  await expect(button).toBeFocused();
  const visible = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    const outline = Number.parseFloat(style.outlineWidth);
    if (outline > 0 && style.outlineStyle !== "none") return true;
    if (style.boxShadow !== "none") return true;
    const ring = getComputedStyle(el).getPropertyValue("--ring").trim();
    if (!ring) return false;
    const probe = document.createElement("span");
    probe.style.outline = `2px solid hsl(${ring})`;
    el.appendChild(probe);
    const w = Number.parseFloat(getComputedStyle(probe).outlineWidth);
    probe.remove();
    return w > 0;
  });
  expect(visible).toBe(true);
}

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
  // Colour transitions (identity/mode switches) leave blended mid-frames that axe would sample.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) animation.finish();
    }
  });
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
    const fgRgb = parse(getComputedStyle(el).color);
    let bgRgb: [number, number, number] | null = null;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (!isTransparent(bg)) {
        bgRgb = parse(bg);
        if (bgRgb) break;
      }
    }
    if (!fgRgb || !bgRgb) {
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
