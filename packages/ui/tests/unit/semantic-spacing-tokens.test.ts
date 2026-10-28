import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const identities = readFileSync(resolve(process.cwd(), "src/identities.css"), "utf8");

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

  it("leaves deprecated rem aliases in place", () => {
    expect(css).toMatch(/--spacing-button-gap:\s*0\.5rem;/);
    expect(css).toMatch(/--spacing-icon-control:\s*1rem;/);
    expect(css).toMatch(/--spacing-control-height:\s*max\(var\(--zk-tap-min, 0px\), 2\.25rem\)/);
  });
});
