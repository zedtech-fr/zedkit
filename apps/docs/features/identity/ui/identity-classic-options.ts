import { identityPresets, type IdentityTokens } from "@zedtech/zedkit-ui";

type FontPair = { id: string; label: string; fontSans: string; fontDisplay: string };
type DepthOption = { id: "none" | "soft" | "medium" | "strong"; shadowSm: string; shadowMd: string };

const SHADOW_INK = "0 0% 0%";

/** Neutral shadows: Classic offers a few steps, Expert keeps the exact values. */
const DEPTH_OPTIONS: readonly DepthOption[] = [
  { id: "none", shadowSm: "none", shadowMd: "none" },
  {
    id: "soft",
    shadowSm: `0 1px 2px hsl(${SHADOW_INK} / 0.06)`,
    shadowMd: `0 4px 12px -2px hsl(${SHADOW_INK} / 0.08)`,
  },
  {
    id: "medium",
    shadowSm: `0 1px 3px 0 hsl(${SHADOW_INK} / 0.1), 0 1px 2px -1px hsl(${SHADOW_INK} / 0.1)`,
    shadowMd: `0 4px 6px -1px hsl(${SHADOW_INK} / 0.1), 0 2px 4px -2px hsl(${SHADOW_INK} / 0.1)`,
  },
  {
    id: "strong",
    shadowSm: `0 3px 10px hsl(${SHADOW_INK} / 0.18)`,
    shadowMd: `0 12px 32px -8px hsl(${SHADOW_INK} / 0.28)`,
  },
];

/** `"Space Grotesk Variable", ...` becomes `Space Grotesk`. */
function familyName(stack: string): string {
  const first = stack.split(",")[0] ?? stack;
  return first.replaceAll(/["']/g, "").replace(/\s+Variable$/, "").trim();
}

/** Every distinct sans + display pair the shipped looks use: no second font list to keep in sync. */
function fontPairs(): FontPair[] {
  const pairs = new Map<string, FontPair>();
  for (const preset of Object.values(identityPresets)) {
    const id = `${preset.fontSans}|${preset.fontDisplay}`;
    if (pairs.has(id)) continue;
    const sans = familyName(preset.fontSans);
    const display = familyName(preset.fontDisplay);
    pairs.set(id, {
      id,
      label: sans === display ? sans : `${display} + ${sans}`,
      fontSans: preset.fontSans,
      fontDisplay: preset.fontDisplay,
    });
  }
  return [...pairs.values()];
}

const FONT_PAIRS = fontPairs();

function fontPairId(tokens: Pick<IdentityTokens, "fontSans" | "fontDisplay">): string {
  const id = `${tokens.fontSans}|${tokens.fontDisplay}`;
  return FONT_PAIRS.some((pair) => pair.id === id) ? id : "custom";
}

function depthId(tokens: Pick<IdentityTokens, "shadowSm" | "shadowMd">): DepthOption["id"] | "custom" {
  return DEPTH_OPTIONS.find((o) => o.shadowSm === tokens.shadowSm && o.shadowMd === tokens.shadowMd)?.id ?? "custom";
}

/** `1.5px` to 1.5. Unparseable falls to the bound so the slider never lies. */
function parsePx(value: string, min: number, max: number): number {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  const n = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

export { DEPTH_OPTIONS, FONT_PAIRS, depthId, familyName, fontPairId, parsePx };
export type { DepthOption, FontPair };
