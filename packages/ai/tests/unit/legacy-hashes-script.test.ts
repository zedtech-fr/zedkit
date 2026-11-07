import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readLegacyHashFile } from "#legacy.js";
import { tempDir } from "./helpers.js";

const aiRoot = fileURLToPath(new URL("../../", import.meta.url));

describe("legacy-hashes.mjs", () => {
  it("readLegacyHashFile rejects invalid JSON and accepts a missing file", () => {
    const dir = tempDir();
    const broken = join(dir, "legacy-hashes.json");
    writeFileSync(broken, "{ not-json\n");
    expect(readLegacyHashFile(broken)).toMatchObject({ status: "invalid" });
    expect(readLegacyHashFile(join(dir, "nope.json"))).toEqual({ status: "missing" });
  });

  it("exits before write when the on-disk prior is invalid (script source)", () => {
    const src = readFileSync(join(aiRoot, "scripts", "legacy-hashes.mjs"), "utf8");
    expect(src).toContain("readLegacyHashFile(hashesPath)");
    expect(src).toMatch(/snapshot\.status === "invalid"/u);
    expect(src).toContain("process.exit(1)");
  });
});
