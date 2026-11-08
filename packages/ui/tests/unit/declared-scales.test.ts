import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// D-S1: the declared scales, as hand-written tables. These expectations
// are NOT generated from styles.css — they are the law the CSS must
// match, so a planted off-scale value fails here. Equal values across
// purposes are expected and fine; nothing below asserts uniqueness.

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");

function packageCss(): string {
  const files = [
    ...readdirSync(src).filter((f) => f.endsWith(".css")),
    ...readdirSync(join(src, "identities")).map((f) => join("identities", f)),
  ];
  return files.map((f) => readFileSync(join(src, f), "utf8")).join("\n");
}

/** Spacing multipliers that resolve off the declared set at stock density. */
export function offScaleMultipliers(css: string): number[] {
  const bad = new Set<number>();
  for (const match of css.matchAll(/calc\(var\(--spacing\)\s*\*\s*(-?[\d.]+)\)/g)) {
    const n = Math.abs(Number.parseFloat(match[1] ?? "NaN"));
    if (!ALLOWED_MULTIPLIERS.has(n)) bad.add(n);
  }
  return [...bad].sort((a, b) => a - b);
}

// Stock --spacing is 0.25rem (4px). Rhythm steps run in 2px halves to
// 16px, then whole steps to 48px; larger entries are named measures
// (widths, basis, heights), not rhythm. 0.75 (3px) is the named optical
// exception (alert icon nudge). Negatives mirror positives.
const ALLOWED_MULTIPLIERS = new Set([
  0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  14, 15, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96,
]);

// Type steps (shared-type-scale.css): finite rem sizes, 12px floor.
const TYPE_STEPS: Record<string, string> = {
  "--text-xs": "0.75rem",
  "--text-sm": "0.8125rem",
  "--text-base": "0.875rem",
  "--text-lg": "1.0625rem",
  "--text-xl": "1.125rem",
  "--text-2xl": "clamp(1.375rem, 1vw + 1.125rem, 1.625rem)",
  "--text-3xl": "1.75rem",
  "--text-4xl": "clamp(2rem, 2.5vw + 1rem, 2.75rem)",
  "--text-5xl": "2.75rem",
};

// Radius steps (identities.css shared block): recipe-selectable steps.
const RADIUS_STEPS: Record<string, string> = {
  "--radius": "0.5rem",
  "--radius-xs": "0.125rem",
  "--radius-sm": "calc(var(--radius) - 4px)",
  "--radius-md": "calc(var(--radius) - 2px)",
  "--radius-lg": "var(--radius)",
  "--radius-xl": "0.75rem",
  "--radius-2xl": "1rem",
  "--radius-3xl": "1.5rem",
};

function varValue(css: string, name: string): string | undefined {
  const match = css.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+);`));
  return match?.[1]?.trim();
}

describe("declared scales (D-S1)", () => {
  const css = packageCss();

  it("keeps every spacing multiplier on the declared set", () => {
    expect(offScaleMultipliers(css)).toEqual([]);
  });

  it("catches a planted off-scale multiplier (mutation probe)", () => {
    expect(offScaleMultipliers(".x { gap: calc(var(--spacing) * 2.7); }")).toEqual([2.7]);
    expect(offScaleMultipliers(".x { gap: calc(var(--spacing) * 3); }")).toEqual([]);
  });

  it("keeps type steps on the declared rem scale", () => {
    const typeCss = readFileSync(join(src, "shared-type-scale.css"), "utf8");
    for (const [name, value] of Object.entries(TYPE_STEPS)) {
      expect(varValue(typeCss, name), name).toBe(value);
    }
  });

  it("keeps radius steps on the declared scale (recipe inputs)", () => {
    const identities = readFileSync(join(src, "identities.css"), "utf8");
    for (const [name, value] of Object.entries(RADIUS_STEPS)) {
      expect(varValue(identities, name), name).toBe(value);
    }
  });

  it("never redefines the root font size", () => {
    // A real `font-size:` declaration (not a --zk-*-font-size custom property).
    expect(css).not.toMatch(/:root[^{]*\{[^}]*[;{\n]\s*font-size\s*:/);
    expect(css).not.toMatch(/\bhtml\s*\{[^}]*[;{\n]\s*font-size\s*:/);
  });
});
