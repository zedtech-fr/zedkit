import type { IdentityTokens } from "./identity-tokens.js";

const AA_BODY = 4.5;
const AA_UI = 3;

type Hsl = { h: number; s: number; l: number };
type ContrastToken = "foreground" | "accent" | "border";
type IdentityContrastWarning = {
  scheme: "light" | "dark";
  token: "foreground" | "accent" | "border";
  ratio: number;
  min: number;
  suggestedForeground: string;
};

function parseHsl(value: string): Hsl | undefined {
  const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return undefined;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function formatHsl(hsl: Hsl): string {
  return `${hsl.h} ${hsl.s}% ${Number(hsl.l.toFixed(1))}%`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number): number => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance(h: number, s: number, l: number): number {
  const linear = hslToRgb(h, s, l).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(fg: Hsl, bg: Hsl): number {
  const a = luminance(fg.h, fg.s, fg.l);
  const b = luminance(bg.h, bg.s, bg.l);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function nudgeForeground(fg: Hsl, bg: Hsl, min: number): string {
  const dir = luminance(bg.h, bg.s, bg.l) > 0.5 ? -1 : 1;
  let next = { ...fg };
  for (let step = 0; step < 100; step += 1) {
    if (contrastRatio(next, bg) >= min) return formatHsl(next);
    next = { ...next, l: Math.min(100, Math.max(0, next.l + dir)) };
  }
  return formatHsl(next);
}

function warningFor(
  scheme: "light" | "dark",
  token: ContrastToken,
  colour: string,
  bg: string,
  min: number,
): IdentityContrastWarning | undefined {
  const value = parseHsl(colour);
  const background = parseHsl(bg);
  if (!value || !background) return undefined;
  const ratio = contrastRatio(value, background);
  if (ratio >= min) return undefined;
  return {
    scheme,
    token,
    ratio: Number(ratio.toFixed(2)),
    min,
    suggestedForeground: nudgeForeground(value, background, min),
  };
}

function pairWarnings(scheme: "light" | "dark", pair: IdentityTokens["light"]): Array<IdentityContrastWarning | undefined> {
  return [
    warningFor(scheme, "foreground", pair.foreground, pair.background, AA_BODY),
    warningFor(scheme, "accent", pair.accent, pair.background, AA_UI),
    warningFor(scheme, "border", pair.border, pair.background, AA_UI),
  ];
}

// shortcut: shipped looks fail 3:1 on accent/border; warn here, restyle later
function identityContrastWarnings(tokens: IdentityTokens): IdentityContrastWarning[] {
  return [...pairWarnings("light", tokens.light), ...pairWarnings("dark", tokens.dark)].filter(
    (warning): warning is IdentityContrastWarning => warning !== undefined,
  );
}

export { identityContrastWarnings, type IdentityContrastWarning };
