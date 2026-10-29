import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = resolve(__dirname, "../..");

const css = readFileSync(resolve(pkg, "src/styles.css"), "utf8");
const identities = readFileSync(resolve(pkg, "src/identities.css"), "utf8");

/** Mist / stock `--spacing` (identities.css). */
const MIST_SPACING_REM = 0.25;

const TOKENS = {
  "--zk-gap-sm": { factor: 2, mistRem: 0.5 },
  "--zk-gap-md": { factor: 3, mistRem: 0.75 },
  "--zk-gap-lg": { factor: 4, mistRem: 1 },
  "--zk-icon-size": { factor: 4, mistRem: 1 },
  "--zk-control-height": { factor: 9, mistRem: 2.25 },
} as const;

describe("semantic spacing tokens (#798)", () => {
  it("keeps mist spacing at 0.25rem so the multipliers stay exact", () => {
    expect(identities).toMatch(/--spacing:\s*0\.25rem;/);
  });

  it("derives each token from --spacing with the mist-matching factor", () => {
    for (const [name, { factor, mistRem }] of Object.entries(TOKENS)) {
      const pattern = new RegExp(`${name}:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*${factor}\\)`);
      expect(css, name).toMatch(pattern);
      expect(MIST_SPACING_REM * factor).toBeCloseTo(mistRem, 10);
    }
  });

  it("leaves leftover rem aliases in place", () => {
    expect(css).toMatch(/--spacing-button-gap:\s*0\.5rem;/);
    expect(css).toMatch(/--spacing-icon-control:\s*1rem;/);
  });

  it("wires control height and block aliases to --spacing", () => {
    expect(css).toMatch(/--spacing-control-height:\s*max\(var\(--zk-tap-min, 0px\), var\(--zk-control-height\)\)/);
    expect(css).toMatch(/--spacing-control-height-sm:\s*max\(var\(--zk-tap-min, 0px\), calc\(var\(--spacing\) \* 8\)\)/);
    expect(css).toMatch(/--spacing-control-height-lg:\s*max\(var\(--zk-tap-min, 0px\), calc\(var\(--spacing\) \* 10\)\)/);
    expect(css).toMatch(/--spacing-control-block:\s*var\(--spacing\)/);
    expect(css).toMatch(/--spacing-control-block-lg:\s*calc\(var\(--spacing\) \* 2\)/);
    expect(MIST_SPACING_REM * 8).toBe(2);
    expect(MIST_SPACING_REM * 9).toBe(2.25);
    expect(MIST_SPACING_REM * 10).toBe(2.5);
    expect(MIST_SPACING_REM * 2).toBe(0.5);
  });
});
