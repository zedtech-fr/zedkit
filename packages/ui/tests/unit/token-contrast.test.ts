import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "styles.css");

type RGB = [number, number, number];

/** Parses an `H S% L%` triplet as stored in the theme tokens. */
function parseTriplet(value: string): [number, number, number] {
  const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) throw new Error(`not an H S% L% triplet: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Reads one `--token` value from the `:root` or `.dark` block of styles.css. */
function token(theme: "light" | "dark", name: string): [number, number, number] {
  const css = readFileSync(stylesPath, "utf8");
  // Split on the block opener (`.dark {`), not the bare class: comments above mention `.dark`.
  const block = theme === "light" ? css.split(/\.dark\s*\{/)[0]! : (css.split(/\.dark\s*\{/)[1] ?? "");
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token --${name} missing from ${theme} theme`);
  return parseTriplet(match[1]!);
}

function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100;
  l /= 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance([r, g, b]: RGB): number {
  const linear = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrast(fg: [number, number, number], bg: [number, number, number]): number {
  const [a, b] = [luminance(hslToRgb(...fg)), luminance(hslToRgb(...bg))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("theme token contrast (WCAG AA, downstream axe scans depend on it)", () => {
  it.each(["light", "dark"] as const)("destructive text on destructive fills, %s", (theme) => {
    const ratio = contrast(token(theme, "destructive-foreground"), token(theme, "destructive"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("muted text on card surfaces, %s", (theme) => {
    const ratio = contrast(token(theme, "muted-foreground"), token(theme, "card"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
