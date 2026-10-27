import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lensTableRows, shippedNames } from "./helpers.js";

const PROSE = [
  "apps/docs/prose/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo.mdx",
  "apps/docs/prose/ai/check-that-skills-subagents-commands-and-provider-copies-are-valid.mdx",
];
// CLI surface and providers: stable vocabulary, not kit content.
const CLI = new Set(["init", "validate", "list"]);
const PROVIDERS = new Set(["cursor", "claude", "codex", "muse"]);
// Bare prose words, not references.
const GENERIC = new Set(["ok", "name", "description", "skill"]);

function lensNames(): Set<string> {
  return new Set(lensTableRows().map((cells) => cells[1] ?? ""));
}

function repoRoot(): string {
  return fileURLToPath(new URL("../../../..", import.meta.url));
}

describe("prose references", () => {
  it("resolves every bare name in AI prose to a kit concept", () => {
    const known = new Set([
      ...shippedNames(true),
      ...lensNames(),
      ...CLI,
      ...PROVIDERS,
    ]);
    let checked = 0;
    for (const rel of PROSE) {
      const text = readFileSync(join(repoRoot(), rel), "utf8");
      const tokens = new Set(
        [...text.matchAll(/`([a-z][a-z0-9-]*)`/gu)]
          .map((m) => m[1] ?? "")
          .filter((t) => !GENERIC.has(t)),
      );
      for (const token of tokens) {
        checked += 1;
        expect([...known], `${rel} references ${token}`).toContain(token);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
