import { describe, expect, it } from "vitest";

import {
  fieldBorderFor,
  identityContrastTokenLabel,
  identityContrastWarnings,
  keepIdentityDarkKeys,
  withIdentityDarkPair,
} from "#identity/identity-contrast.js";
import { identityPresets, identityTokenSchema, parseIdentityTokens } from "#identity/identity-tokens.js";

function ofToken(
  tokens: ReturnType<typeof identityTokenSchema.parse>,
  token: "foreground" | "primaryForeground" | "mutedForeground" | "accent" | "border",
  scheme?: "light" | "dark",
) {
  return identityContrastWarnings(tokens).filter(
    (warning) => warning.token === token && (scheme === undefined || warning.scheme === scheme),
  );
}

describe("identityContrastWarnings", () => {
  it("accepts every shipped preset on text and accent in light and dark", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityContrastWarnings(tokens)).toEqual([]);
    }
  });

  it("does not warn on the default white / near-black text pair", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.glass,
      light: {
        ...identityPresets.glass.light,
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
      },
    });
    expect(ofToken(tokens, "foreground", "light")).toEqual([]);
  });

  it("does not warn on a decorative light hairline border", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.glass,
      light: {
        ...identityPresets.glass.light,
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        mutedForeground: "240 5% 32%",
        border: "240 5.9% 90%",
      },
    });
    expect(identityContrastWarnings(tokens)).toEqual([]);
    expect(ofToken(tokens, "border", "light")).toEqual([]);
  });

  it("warns when light foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, foreground: identityPresets.mist.light.background },
    });
    const warnings = ofToken(tokens, "foreground", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    expect(warnings[0]?.min).toBe(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "foreground", "light")).toEqual([]);
  });

  it("warns when dark foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      dark: { ...identityPresets.mist.dark, foreground: identityPresets.mist.dark.background },
    });
    const warnings = ofToken(tokens, "foreground", "dark");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      dark: { ...tokens.dark, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "foreground", "dark")).toEqual([]);
  });

  it("warns when light accent matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, accent: identityPresets.mist.light.background },
    });
    const warnings = ofToken(tokens, "accent", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(3);
    expect(warnings[0]?.ratio).toBeLessThan(3);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, accent: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "accent", "light")).toEqual([]);
  });

  it("warns when primary text matches the primary fill", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: {
        ...identityPresets.mist.light,
        primaryForeground: identityPresets.mist.light.primary,
      },
    });
    const warnings = ofToken(tokens, "primaryForeground", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, primaryForeground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "primaryForeground", "light")).toEqual([]);
  });

  it("does not warn when a decorative border matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.press,
      light: { ...identityPresets.press.light, border: identityPresets.press.light.background },
    });
    expect(ofToken(tokens, "border", "light")).toEqual([]);
  });

  it("still warns when a user edit matches text to the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.glass,
      light: {
        ...identityPresets.glass.light,
        background: "0 0% 100%",
        foreground: "0 0% 100%",
        mutedForeground: "240 5% 32%",
        border: "240 5.9% 90%",
      },
    });
    const warnings = ofToken(tokens, "foreground", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(4.5);
  });
});

describe("withIdentityDarkPair", () => {
  it("writes an AA dark pair from a custom light pair", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: {
        background: "200 80% 96%",
        foreground: "200 50% 12%",
        primary: "200 80% 36%",
        primaryForeground: "0 0% 100%",
        accent: "200 80% 32%",
        border: "200 30% 40%",
        mutedForeground: "200 50% 12%",
      },
    });
    const next = withIdentityDarkPair(tokens);
    expect(next.dark.background).not.toBe(identityPresets.mist.dark.background);
    expect(identityContrastWarnings(next)).toEqual([]);
  });

  it("keeps dark when light colours did not change", () => {
    const spaced = identityTokenSchema.parse({ ...identityPresets.mist, spacing: "0.4rem" });
    expect(withIdentityDarkPair(spaced, identityPresets.mist).dark).toEqual(identityPresets.mist.dark);
  });

  it("keeps a dark colour the user set and rewrites the rest", () => {
    const generated = withIdentityDarkPair(
      identityTokenSchema.parse({
        ...identityPresets.mist,
        light: { ...identityPresets.mist.light, background: "0 0% 95%" },
      }),
    );
    const previous = identityTokenSchema.parse({
      ...generated,
      dark: { ...generated.dark, background: "120 40% 20%" },
    });
    const rewritten = withIdentityDarkPair(
      identityTokenSchema.parse({
        ...previous,
        light: { ...previous.light, background: "200 80% 96%" },
      }),
      previous,
    );
    const next = keepIdentityDarkKeys(rewritten, previous, ["background"]);
    expect(rewritten.dark.background).not.toBe("120 40% 20%");
    expect(next.dark.background).toBe("120 40% 20%");
    expect(next.dark.foreground).toBe(rewritten.dark.foreground);
  });
});

describe("unreadable colours and labels", () => {
  const loose = (light: Partial<(typeof identityPresets.mist)["light"]>) =>
    ({ ...identityPresets.mist, light: { ...identityPresets.mist.light, ...light } }) as typeof identityPresets.mist;

  it("names each token the way the editor says it", () => {
    expect(identityContrastTokenLabel("foreground")).toBe("text");
    expect(identityContrastTokenLabel("primaryForeground")).toBe("primary text");
    expect(identityContrastTokenLabel("mutedForeground")).toBe("muted text");
    expect(identityContrastTokenLabel("accent")).toBe("accent");
    expect(identityContrastTokenLabel("border")).toBe("border");
  });

  it("does not warn about a colour it cannot read", () => {
    const warnings = identityContrastWarnings(loose({ foreground: "not-a-colour", accent: "red" }));
    expect(warnings.filter((w) => w.scheme === "light" && (w.token === "foreground" || w.token === "accent"))).toEqual([]);
    expect(identityContrastWarnings(loose({ background: "nope" })).filter((w) => w.scheme === "light")).toEqual([]);
  });

  it("keeps an unreadable light background as it is when it writes the dark pair", () => {
    const next = withIdentityDarkPair(loose({ background: "nope" }));
    expect(next.dark.background).toBe("nope");
  });

  it("skips an unreadable colour while it repairs the rest of the dark pair", () => {
    const next = withIdentityDarkPair(loose({ foreground: "nope", accent: "also-nope" }));
    expect(next.dark.foreground).toBe("nope");
    expect(next.dark.accent).toBe("also-nope");
    expect(next.dark.background).not.toBe("nope");
  });

  it("darkens a very light inverted background until it reads as dark", () => {
    const next = withIdentityDarkPair(loose({ background: "40 30% 3%" }));
    const lightness = Number(next.dark.background.split(" ")[2]?.replace("%", ""));
    expect(lightness).toBeLessThan(97);
    expect(identityContrastWarnings(next).filter((w) => w.scheme === "dark")).toEqual([]);
  });

  it("leaves the primary text alone when the primary fill is unreadable", () => {
    const next = withIdentityDarkPair(loose({ primary: "nope" }));
    expect(next.dark.primary).toBe("nope");
  });
});

function hslContrast(a: string, b: string): number {
  const parse = (value: string) => {
    const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
    if (!match) return undefined;
    return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
  };
  const luminance = (hsl: { h: number; s: number; l: number }) => {
    const sat = hsl.s / 100;
    const light = hsl.l / 100;
    const k = (n: number) => (n + hsl.h / 30) % 12;
    const chroma = sat * Math.min(light, 1 - light);
    const f = (n: number) => light - chroma * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const linear = [f(0), f(8), f(4)].map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
  };
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return 0;
  const L1 = luminance(left);
  const L2 = luminance(right);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

describe("fieldBorderFor", () => {
  it("nudges a hairline --input to at least 3:1 against the surface", () => {
    const hairline = "240 5.9% 90%";
    const background = "0 0% 100%";
    expect(hslContrast(hairline, background)).toBeLessThan(3);
    const input = fieldBorderFor(hairline, background);
    expect(input).not.toBe(hairline);
    expect(hslContrast(input, background)).toBeGreaterThanOrEqual(3);
  });

  it("keeps a border that already meets 3:1", () => {
    expect(fieldBorderFor("240 10% 3.9%", "0 0% 100%")).toBe("240 10% 3.9%");
  });
});
