import { describe, expect, it } from "vitest";
import {
  legacyHashMergeIssues,
  mergeLegacyHashMaps,
  readLegacyHashFile,
  type LegacyHashMap,
} from "#legacy.js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempDir } from "./helpers.js";

describe("legacy hash file read", () => {
  it("does not treat invalid JSON as an empty prior", () => {
    const dir = tempDir();
    const path = join(dir, "legacy-hashes.json");
    writeFileSync(path, '{"agents":{}}\n');
    expect(readLegacyHashFile(path)).toMatchObject({ status: "ok" });
    writeFileSync(path, "not json");
    expect(readLegacyHashFile(path).status).toBe("invalid");
  });
});

describe("legacy hash regeneration", () => {
  const prior: LegacyHashMap = {
    agents: { explorer: ["abc123", "def456"] },
    commands: { review: ["oldhash00000001"] },
  };

  it("merges prior hashes when git returns nothing after a shallow clone", () => {
    const computed: LegacyHashMap = { agents: { explorer: [] }, commands: { review: [] } };
    const merged = mergeLegacyHashMaps(prior, computed);
    expect(merged.agents.explorer).toEqual(["abc123", "def456"]);
    expect(merged.commands.review).toEqual(["oldhash00000001"]);
    expect(legacyHashMergeIssues(prior, merged)).toEqual([]);
  });

  it("adds newly discovered hashes without dropping prior ones", () => {
    const computed: LegacyHashMap = {
      agents: { explorer: ["newhash00000001"] },
      commands: {},
    };
    const merged = mergeLegacyHashMaps(prior, computed);
    expect(merged.agents.explorer).toEqual(["abc123", "def456", "newhash00000001"]);
  });

  it("reports when a prior hash would be lost", () => {
    const merged: LegacyHashMap = { agents: { explorer: ["abc123"] }, commands: {} };
    const issues = legacyHashMergeIssues(prior, merged);
    expect(issues.some((line) => line.startsWith("commands/review:"))).toBe(true);
  });
});
