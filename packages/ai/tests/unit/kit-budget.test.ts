import { kitDir } from "#kit.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Simplification ratchet for IMPL-09 (numbers from `.scratch/.../IMPL-09/measurements.md` and S3).
// File I/O is ~ms; context (words) dominates. These caps are tripwires, not targets: bumping one is a deliberate
// product decision (same philosophy as the version-pin guard), never a drive-by edit to make red green.
function measure(skills: string[]): { files: number; bytes: number; words: number } {
  const out = { files: 0, bytes: 0, words: 0 };
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else {
        const data = readFileSync(p);
        out.files += 1;
        out.bytes += data.length;
        out.words += data.toString("utf8").split(/\s+/).length;
      }
    }
  };
  for (const skill of skills) walk(join(kitDir(), "skills", skill));
  return out;
}

describe("kit preset budgets (simplification ratchet)", () => {
  const kit = JSON.parse(readFileSync(join(kitDir(), "kit.json"), "utf8")) as {
    presets: Record<string, string[]>;
  };

  it.each([
    // [preset, maxFiles, maxBytes, maxWords] — headroom over 2026-11-09 measured (starter 35/185KB/26k, setup 73/304KB/45k).
    ["starter", 40, 220_000, 30_000],
    ["setup", 85, 400_000, 55_000],
  ] as const)("preset %s stays within its budget", (preset, maxFiles, maxBytes, maxWords) => {
    const got = measure(kit.presets[preset] ?? []);
    expect(got.files).toBeLessThanOrEqual(maxFiles);
    expect(got.bytes).toBeLessThanOrEqual(maxBytes);
    expect(got.words).toBeLessThanOrEqual(maxWords);
  });

  it("the full kit stays within its budget", () => {
    const all = readdirSync(join(kitDir(), "skills"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const got = measure(all);
    expect(got.files).toBeLessThanOrEqual(125);
    expect(got.words).toBeLessThanOrEqual(75_000);
  });
});
