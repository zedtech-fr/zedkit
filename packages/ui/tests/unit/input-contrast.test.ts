import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resting field border (--input) is what makes an empty control identifiable
// (WCAG 1.4.11, 3:1 against the surface it sits on). These checks use the
// token values, not a rendered Glass blur. The divider (--border) is left
// alone: the fix is a clearer control boundary, not a quieter page.

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const files = [
  "styles.css",
  "identities.css",
  "identities/maison.css",
  "identities/press.css",
  "identities/tide.css",
  "identities/volt.css",
  "identities/glass.css",
];

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lit = l / 100;
  const a = sat * Math.min(lit, 1 - lit);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return lit - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [f(0), f(8), f(4)].map((part) => Math.round(part * 255)) as [number, number, number];
}

function luminance(hsl: [number, number, number]): number {
  const [r, g, b] = rgb(hsl[0], hsl[1], hsl[2]);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const left = luminance(a);
  const right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

function parseHsl(value: string): [number, number, number] {
  const match = /([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/u.exec(value);
  if (!match) throw new Error(`not an hsl triple: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function blocks(css: string): { selector: string; body: string }[] {
  const found: { selector: string; body: string }[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/gu;
  let match = pattern.exec(css);
  while (match) {
    found.push({ selector: (match[1] ?? "").replace(/\s+/gu, " ").trim(), body: match[2] ?? "" });
    match = pattern.exec(css);
  }
  return found;
}

function decl(body: string, name: string): string | null {
  const match = new RegExp(`--${name}:\\s*([^;]+)`, "u").exec(body);
  return match?.[1]?.trim() ?? null;
}

describe("input border contrast", () => {
  it("keeps the resting field border at 3:1 on background, card and muted", () => {
    const failures: string[] = [];
    let seen = 0;
    for (const file of files) {
      const css = readFileSync(join(root, file), "utf8");
      for (const block of blocks(css)) {
        const input = decl(block.body, "input");
        const background = decl(block.body, "background");
        const card = decl(block.body, "card");
        const muted = decl(block.body, "muted");
        if (!input || !background || !card || !muted) continue;
        seen += 1;
        const boundary = parseHsl(input);
        for (const [name, value] of [
          ["background", background],
          ["card", card],
          ["muted", muted],
        ] as const) {
          const ratio = contrast(boundary, parseHsl(value));
          if (ratio < 3) {
            failures.push(`${file} ${block.selector.slice(0, 48)} vs ${name} ${ratio.toFixed(2)}`);
          }
        }
      }
    }
    expect(seen).toBeGreaterThanOrEqual(12);
    expect(failures).toEqual([]);
  });
});
