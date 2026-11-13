import { describe, expect, it } from "vitest";

import { identityContrastWarnings, identityPresets, repairContrast } from "#index.js";

describe("repairContrast", () => {
  it("returns a passing identity unchanged", () => {
    for (const preset of Object.values(identityPresets)) {
      const out = repairContrast(preset);
      expect(out.adjusted).toBe(0);
      expect(out.tokens).toEqual(preset);
    }
  });

  it("moves pale text on a pale background until it passes in both modes and leaves radius, fonts, and background alone", () => {
    const weak = {
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, foreground: "0 0% 80%" },
      dark: { ...identityPresets.mist.dark, foreground: "0 0% 20%" },
    };
    expect(identityContrastWarnings(weak).length).toBeGreaterThanOrEqual(2);
    const out = repairContrast(weak);
    expect(identityContrastWarnings(out.tokens)).toEqual([]);
    expect(out.adjusted).toBeGreaterThanOrEqual(2);
    expect(out.tokens.radius).toBe(weak.radius);
    expect(out.tokens.light.background).toBe(weak.light.background);
    expect(out.tokens.fontSans).toBe(weak.fontSans);
  });

  it("reaches 4.5:1 on a mid-tone background the old one-way nudge left failing", () => {
    // Gray 62% has luminance just above the black/white crossover but under 0.5, so lightening the text can never
    // pass; only darkening does. The previous nudge lightened, ended at white and still reported success.
    const midTone = {
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, background: "0 0% 62%", foreground: "0 0% 70%" },
    };
    const out = repairContrast(midTone);
    expect(out.remaining).toBe(0);
    expect(identityContrastWarnings(out.tokens)).toEqual([]);
  });

  it("does not mutate the input and reports remaining as the live warning count", () => {
    const weak = {
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, foreground: "0 0% 80%" },
    };
    const snapshot = structuredClone(weak);
    const out = repairContrast(weak);
    expect(weak).toEqual(snapshot);
    expect(out.remaining).toBe(identityContrastWarnings(out.tokens).length);
  });
});
