import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";

describe("manifest files", () => {
  it("lists every agent and command file in the manifest", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const dirs = [
      ["agents", manifest.value.agents],
      ["commands", manifest.value.commands ?? []],
    ] as const;
    for (const [dir, listed] of dirs) {
      const entries = readdirSync(join(kitDir(), dir));
      expect(
        entries.filter((entry) => !entry.endsWith(".md")),
        `${dir} non-markdown entries`,
      ).toEqual([]);
      const strays = entries
        .map((entry) => entry.replace(/\.md$/, ""))
        .filter((name) => !listed.includes(name));
      expect(strays, `${dir} files missing from manifest`).toEqual([]);
    }
  });
});
