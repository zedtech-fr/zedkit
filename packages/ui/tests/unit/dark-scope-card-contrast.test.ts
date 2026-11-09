import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "identities", "glass.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Every value a token takes in the file, in source order: light, dark, then fallbacks. */
function values(name: string): string[] {
  return [...css.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))].map((match) => (match[1] ?? "").replace(/\s+/g, " ").trim());
}

type Hsl = { h: number; s: number; l: number };

/** Same WCAG math as `identity-contrast.ts` (canonical implementation); kept here so the test pins the composed result, not the helper. */
function parseHsl(value: string): Hsl {
  const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) throw new Error(`not an HSL triplet: ${value}`);
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function toRgb({ h, s, l }: Hsl): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number): number => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance(rgb: [number, number, number]): number {
  const linear = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** Alpha-composite a translucent fill over an opaque backdrop, then WCAG-contrast it against a text colour. */
function compositedRatio(text: string, fill: string, alpha: number, backdrop: string): number {
  const fg = toRgb(parseHsl(text));
  const composed = toRgb(parseHsl(fill)).map((c, i) => alpha * c + (1 - alpha) * toRgb(parseHsl(backdrop))[i]!) as [
    number,
    number,
    number,
  ];
  const a = luminance(fg);
  const b = luminance(composed);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("dark glass card over a light page (IMPL-03)", () => {
  // Documented composition: a dark glass scope Card nested in a light glass page. The fill is the dark card colour at
  // the dark card alpha over the light page background; the text is the dark card foreground. No-blur, no-sheen
  // computation — the worst case a translucent fill must survive on its own. Rendered proof stays with the CI
  // overlay/material specs; this test pins the composed fill ratio so the tokens cannot silently regress it.
  const [lightCard, darkCard] = [values("--card")[0]!, values("--card")[1]!];
  const [lightCardFg, darkCardFg] = [values("--card-foreground")[0]!, values("--card-foreground")[1]!];
  const [, darkAlpha] = values("--zk-glass-alpha").map(Number);
  const [lightPage] = [values("--background")[0]!];

  it("keeps dark card text at AA on the composited fill over a light page", () => {
    expect(compositedRatio(darkCardFg, darkCard, darkAlpha!, lightPage)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps light card text at AA on the composited fill (no regression the other way)", () => {
    const [lightAlpha] = values("--zk-glass-alpha").map(Number);
    expect(compositedRatio(lightCardFg, lightCard, lightAlpha!, lightPage)).toBeGreaterThanOrEqual(4.5);
  });
});
