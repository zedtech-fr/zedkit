import { describe, expect, it } from "vitest";

import { identityContrastWarnings } from "#identity-contrast.js";
import { identityPresets, identityTokenSchema, parseIdentityTokens } from "#identity-tokens.js";

describe("identityContrastWarnings", () => {
  it("accepts every shipped preset on fg/bg in light and dark", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityContrastWarnings(tokens)).toEqual([]);
    }
  });

  it("warns when light foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, foreground: identityPresets.mist.light.background },
    });
    const warnings = identityContrastWarnings(tokens);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.scheme).toBe("light");
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    expect(warnings[0]?.min).toBe(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(identityContrastWarnings(fixed.data)).toEqual([]);
  });

  it("warns when dark foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      dark: { ...identityPresets.mist.dark, foreground: identityPresets.mist.dark.background },
    });
    const warnings = identityContrastWarnings(tokens);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.scheme).toBe("dark");
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      dark: { ...tokens.dark, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(identityContrastWarnings(fixed.data)).toEqual([]);
  });
});
