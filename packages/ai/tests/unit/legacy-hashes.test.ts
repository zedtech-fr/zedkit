import { describe, expect, it } from "vitest";
import { legacyHashMergeIssues, mergeLegacyHashMaps, type LegacyHashMap } from "#legacy.js";

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
