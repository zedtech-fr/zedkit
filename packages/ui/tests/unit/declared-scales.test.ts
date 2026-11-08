import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

// D-S1: the declared scales, as hand-written tables. These expectations
// are NOT generated from styles.css — they are the law the CSS must
// match, so a planted off-scale value fails here. Equal values across
// purposes are expected and fine; nothing below asserts uniqueness.
// Colour composition is 60/30/10 as a qualitative heuristic (foundation /
// supporting surfaces / restrained emphasis), never a pixel-percentage test.

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");

function packageCss(): string {
  const files = [
    ...readdirSync(src).filter((f) => f.endsWith(".css")),
    ...readdirSync(join(src, "identities")).map((f) => join("identities", f)),
  ];
  return files.map((f) => readFileSync(join(src, f), "utf8")).join("\n");
}

const RHYTHM = new Set([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const LARGE = new Set([14, 15, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96]);
const OPTICAL = 0.75;

const SPACING_PROP = /^(padding|margin|gap|inset|scroll-margin|scroll-padding)/;
const MEASURE_PROP = /^(width|min-width|max-width|height|min-height|max-height|flex-basis|inline-size|block-size|top|right|bottom|left)$/;
const CALC_SPACING =
  /calc\(\s*(?:var\(--spacing\)\s*\*\s*(-?[\d.]+)|(-?[\d.]+)\s*\*\s*var\(--spacing\))\s*\)/g;

function multiplierFromCalc(value: string): number[] {
  const out = [];
  for (const match of value.matchAll(CALC_SPACING)) {
    const n = Math.abs(Number.parseFloat(match[1] ?? match[2] ?? "NaN"));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function ownerName(decl: { parent?: { type?: string; selector?: string; name?: string; params?: string; parent?: unknown } | undefined }): string {
  let node = decl.parent;
  while (node) {
    if (node.type === "atrule" && node.name === "utility") return String(node.params ?? "");
    if (node.type === "rule") return String(node.selector ?? "");
    node = node.parent as typeof node;
  }
  return "";
}

function allowedFor(prop: string, owner: string): Set<number> {
  if (owner.includes("alert") && (prop.includes("nudge") || owner.includes("nudge"))) return new Set([OPTICAL, ...RHYTHM]);
  if (MEASURE_PROP.test(prop) || /scene|editor|caption/.test(owner)) return new Set([...RHYTHM, ...LARGE]);
  if (SPACING_PROP.test(prop)) return RHYTHM;
  return new Set([...RHYTHM, ...LARGE, OPTICAL]);
}

/** Off-scale spacing at the declaration: both calc operand orders, rhythm vs measure. */
export function offScaleDeclarations(css: string): string[] {
  const bad: string[] = [];
  postcss.parse(css).walkDecls((decl) => {
    const owner = ownerName(decl);
    const allowed = allowedFor(decl.prop, owner);
    for (const n of multiplierFromCalc(decl.value)) {
      if (!allowed.has(n)) bad.push(`${owner} ${decl.prop}: ×${n}`);
    }
    if (SPACING_PROP.test(decl.prop) && /^[\d.]+rem$/.test(decl.value.trim())) {
      const rem = Number.parseFloat(decl.value);
      const steps = rem / 0.25;
      if (!allowed.has(steps) && rem !== 1.5 && rem !== 2 && rem !== 2.5 && rem !== 3.5) {
        bad.push(`${owner} ${decl.prop}: ${decl.value}`);
      }
    }
  });
  return bad.sort();
}

export function offScaleMultipliers(css: string): number[] {
  return [...new Set(offScaleDeclarations(css).map((row) => Number.parseFloat(row.split("×")[1] ?? "NaN")))].filter(
    (n) => Number.isFinite(n),
  ).sort((a, b) => a - b);
}

// Type steps (shared-type-scale.css): finite rem sizes, 12px floor.
const TYPE_STEPS: Record<string, string> = {
  "--text-xs": "0.75rem",
  "--text-sm": "0.8125rem",
  "--text-base": "0.875rem",
  "--text-lg": "1.0625rem",
  "--text-xl": "1.125rem",
  "--text-heading": "1.5rem",
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
    expect(offScaleDeclarations(css)).toEqual([]);
  });

  it("catches a planted off-scale multiplier in either operand order", () => {
    expect(offScaleMultipliers(".x { gap: calc(var(--spacing) * 2.7); }")).toEqual([2.7]);
    expect(offScaleMultipliers(".x { gap: calc(2.7 * var(--spacing)); }")).toEqual([2.7]);
    expect(offScaleMultipliers(".x { gap: calc(var(--spacing) * 3); }")).toEqual([]);
    expect(offScaleDeclarations(".x { padding: 0.675rem; }")).toEqual([".x padding: 0.675rem"]);
    expect(offScaleDeclarations(".x { width: calc(var(--spacing) * 48); }")).toEqual([]);
  });

  it("records type as size / line-height / weight triples", () => {
    expect(varValue(css, "--text-heading")).toBe("1.5rem");
    expect(varValue(css, "--text-heading--line-height")).toBe("1.2");
    expect(varValue(readFileSync(join(src, "shared-type-scale.css"), "utf8"), "--zk-type-body-weight")).toBe("400");
    expect(varValue(readFileSync(join(src, "shared-type-scale.css"), "utf8"), "--zk-type-h2-weight")).toBe("600");
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
