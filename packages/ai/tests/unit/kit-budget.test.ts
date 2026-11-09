import { kitDir, readManifest } from "#kit.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillDirs } from "./helpers.js";

// Simplification ratchet for IMPL-09 (numbers from `.scratch/.../IMPL-09/measurements.md` and S3).
// File I/O is ~ms; context (words) dominates. These caps are tripwires, not targets: bumping one is a deliberate
// product decision (same philosophy as the version-pin guard), never a drive-by edit to make red green.
const BUMP_POLICY = "bumping a cap is a deliberate product decision (see header above)";
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
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  const kit = manifest.value;

  it.each([
    // [preset, maxFiles, maxBytes, maxWords] — headroom over 2026-11-09 measured (starter 35/185KB/26k, setup 73/304KB/45k).
    ["starter", 40, 220_000, 30_000],
    ["setup", 85, 400_000, 55_000],
  ] as const)("preset %s stays within its budget", (preset, maxFiles, maxBytes, maxWords) => {
    const skills = kit.presets[preset];
    expect(skills, `preset "${preset}" missing from kit.json`).toBeDefined();
    const got = measure(skills === "*" ? skillDirs() : (skills ?? []));
    expect(got.files, `${preset} files budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(maxFiles);
    expect(got.bytes, `${preset} bytes budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(maxBytes);
    expect(got.words, `${preset} words budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(maxWords);
  });

  it("the full kit stays within its budget", () => {
    // Full-kit baseline 2026-11-09: 107 files / 417KB / 62k words over 46 skills; caps below carry ~20% headroom.
    // No `core` row: core (32 skills) is backstopped by this full-kit cap. skillDirs() counts skill folders only,
    // so top-level stray files (LICENSE-*) never count as skills.
    const got = measure(skillDirs());
    expect(got.files, `full-kit files budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(125);
    expect(got.bytes, `full-kit bytes budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(500_000);
    expect(got.words, `full-kit words budget breached: ${BUMP_POLICY}`).toBeLessThanOrEqual(75_000);
  });
});
