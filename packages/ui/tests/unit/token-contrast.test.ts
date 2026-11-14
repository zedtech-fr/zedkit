import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const stylesPath = join(srcDir, "styles.css");
const identitiesPath = join(srcDir, "identities.css");

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

/** sRGB source-over of `color` at `alpha` onto `surface` (badge-soft 15% wash). */
function wash(color: [number, number, number], surface: [number, number, number], alpha: number): RGB {
  const top = hslToRgb(...color);
  const base = hslToRgb(...surface);
  return [
    alpha * top[0]! + (1 - alpha) * base[0]!,
    alpha * top[1]! + (1 - alpha) * base[1]!,
    alpha * top[2]! + (1 - alpha) * base[2]!,
  ];
}

function contrastOnRgb(fg: [number, number, number], bg: RGB): number {
  const [a, b] = [luminance(hslToRgb(...fg)), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const SURFACES = ["background", "card", "muted", "secondary"] as const;
const SOFT_WASH = 0.15;

/** One CSS block that sets `--token` (stock theme or an identity, light or dark). */
function tokenBlocks(file: string, css: string, token: string): Array<{ label: string; body: string }> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found: Array<{ label: string; body: string }> = [];
  const needle = `--${token}:`;
  for (const match of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = match[2] ?? "";
    if (!body.includes(needle)) continue;
    const selector = (match[1] ?? "").replace(/\s+/g, " ").trim();
    const id = selector.match(/data-identity="([^"]+)"/)?.[1] ?? file;
    const theme = selector.includes(".dark") ? "dark" : "light";
    found.push({ label: `${id} ${theme}`, body });
  }
  return found;
}

function triplet(body: string, name: string, label: string): [number, number, number] {
  const match = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`--${name} missing from ${label}`);
  return parseTriplet(match[1]!);
}

const identityDir = join(srcDir, "identities");
const identityCss = [
  ["styles.css", readFileSync(stylesPath, "utf8")],
  ["identities.css", readFileSync(identitiesPath, "utf8")],
  ...readdirSync(identityDir)
    .filter((file) => file.endsWith(".css"))
    .map((file) => [file, readFileSync(join(identityDir, file), "utf8")] as const),
] as const;
const destructivePalettes = identityCss.flatMap(([file, css]) => tokenBlocks(file, css, "destructive"));
const warningPalettes = identityCss.flatMap(([file, css]) => tokenBlocks(file, css, "warning"));
const PALETTE_LABELS = [
  "glass dark",
  "glass light",
  "maison dark",
  "maison light",
  "mist dark",
  "mist light",
  "press dark",
  "press light",
  "styles.css dark",
  "styles.css light",
  "tide dark",
  "tide light",
  "volt dark",
  "volt light",
].sort();

describe("theme token contrast (WCAG AA, downstream axe scans depend on it)", () => {
  it("covers stock, mist, and every identity file in light and dark", () => {
    expect(destructivePalettes.map((palette) => palette.label).sort()).toEqual(PALETTE_LABELS);
    expect(warningPalettes.map((palette) => palette.label).sort()).toEqual(PALETTE_LABELS);
  });

  it.each(destructivePalettes)("$label destructive button and text", ({ label, body }) => {
    const fill = triplet(body, "destructive", label);
    const ink = triplet(body, "destructive-foreground", label);
    expect(contrast(ink, fill), `${label} button`).toBeGreaterThanOrEqual(4.5);
    for (const surface of SURFACES) {
      expect(contrast(fill, triplet(body, surface, label)), `${label} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(warningPalettes)("$label warning fill, surface, and 15% wash", ({ label, body }) => {
    const fill = triplet(body, "warning", label);
    const ink = triplet(body, "warning-foreground", label);
    expect(contrast(ink, fill), `${label} filled`).toBeGreaterThanOrEqual(4.5);
    for (const surface of SURFACES) {
      const bg = triplet(body, surface, label);
      expect(contrast(fill, bg), `${label} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      expect(contrastOnRgb(fill, wash(fill, bg, SOFT_WASH)), `${label} wash on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(["light", "dark"] as const)("muted text on card surfaces, %s", (theme) => {
    const ratio = contrast(token(theme, "muted-foreground"), token(theme, "card"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("success badge text on success fills, %s", (theme) => {
    const ratio = contrast(token(theme, "success-foreground"), token(theme, "success"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("success ink on 15% wash, %s", (theme) => {
    const fill = token(theme, "success");
    for (const surface of SURFACES) {
      const bg = token(theme, surface);
      expect(contrastOnRgb(fill, wash(fill, bg, SOFT_WASH)), `${theme} success wash on ${surface}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it.each(["light", "dark"] as const)("destructive ink on 15% wash, %s", (theme) => {
    const fill = token(theme, "destructive");
    for (const surface of SURFACES) {
      const bg = token(theme, surface);
      expect(
        contrastOnRgb(fill, wash(fill, bg, SOFT_WASH)),
        `${theme} destructive wash on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(["light", "dark"] as const)("info ink on surfaces, %s", (theme) => {
    const info = token(theme, "info");
    for (const surface of ["background", "card", "muted"] as const) {
      expect(contrast(info, token(theme, surface)), `${theme} info on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(token(theme, "info-foreground"), info), `${theme} info-foreground`).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps dark --info low-chroma", () => {
    const [, saturation] = token("dark", "info");
    expect(saturation).toBeLessThanOrEqual(30);
  });

  it("does not put --info on identity palettes", () => {
    const files = readdirSync(identityDir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => join(identityDir, file));
    for (const file of files) {
      const css = readFileSync(file, "utf8");
      expect(css, file).not.toMatch(/--info:/);
      expect(css, file).not.toMatch(/--info-foreground:/);
    }
  });

  it("declares 15% badge-soft fills and info theme aliases", () => {
    const css = readFileSync(stylesPath, "utf8");
    for (const name of ["success", "warning", "destructive", "info"] as const) {
      expect(css).toMatch(
        new RegExp(
          `@utility badge-soft-${name}\\s*\\{[\\s\\S]*?color-mix\\(in oklab, hsl\\(var\\(--${name}\\)\\) 15%, transparent\\)`,
        ),
      );
    }
    expect(css).toMatch(/--color-info:\s*hsl\(var\(--info\)\)/);
    expect(css).toMatch(/--color-info-foreground:\s*hsl\(var\(--info-foreground\)\)/);
  });

  it("the scoped mist light success fill keeps the same contrast as the stock theme", () => {
    const css = readFileSync(identitiesPath, "utf8");
    const block = css.split(/^\[data-identity-scope\]\[data-identity="mist"\]\s*\{/m).map((part) => part.split(/^\}/m)[0] ?? "").find((part) => part.includes("--success:")) ?? "";
    const read = (name: string) => {
      const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
      if (!match) throw new Error(`--${name} missing from the scoped mist light block`);
      return parseTriplet(match[1]!);
    };
    expect(contrast(read("success-foreground"), read("success"))).toBeGreaterThanOrEqual(4.5);
  });
});
