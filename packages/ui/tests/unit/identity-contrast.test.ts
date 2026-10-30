import { describe, expect, it } from "vitest";

import { identityContrastWarnings } from "#identity-contrast.js";
import { identityPresets, identityTokenSchema, parseIdentityTokens } from "#identity-tokens.js";

function ofToken(
  tokens: ReturnType<typeof identityTokenSchema.parse>,
  token: "foreground" | "accent" | "border",
  scheme?: "light" | "dark",
) {
  return identityContrastWarnings(tokens).filter(
    (warning) => warning.token === token && (scheme === undefined || warning.scheme === scheme),
  );
}

describe("identityContrastWarnings", () => {
  it("accepts every shipped preset on text, accent, and border in light and dark", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityContrastWarnings(tokens)).toEqual([]);
    }
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

  it("warns when light border matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.press,
      light: { ...identityPresets.press.light, border: identityPresets.press.light.background },
    });
    const warnings = ofToken(tokens, "border", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(3);
    expect(warnings[0]?.ratio).toBeLessThan(3);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, border: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "border", "light")).toEqual([]);
  });
});
