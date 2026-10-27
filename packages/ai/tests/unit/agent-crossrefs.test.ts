import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";

// Bare code terms that are domain vocabulary, not kit references: ARIA
// attributes, HTML elements, one CSS media feature, one CLI name.
const GENERIC = new Set([
  "aria-busy",
  "aria-describedby",
  "aria-invalid",
  "aria-live",
  "h1",
  "main",
  "nav",
  "noindex",
  "prefers-reduced-motion",
  "rg",
]);

function knownNames(): Set<string> {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  const skills = readdirSync(join(kitDir(), "skills"));
  return new Set(manifest.value.agents.concat(manifest.value.commands ?? [], skills));
}

describe("agent cross-references", () => {
  it("resolves every bare skill/agent name in agent bodies to shipped content", () => {
    const names = knownNames();
    const files = readdirSync(join(kitDir(), "agents")).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
    let checked = 0;
    for (const file of files) {
      const raw = readFileSync(join(kitDir(), "agents", file), "utf8");
      const tokens = new Set(
        [...raw.matchAll(/`([a-z][a-z0-9-]*)`/gu)]
          .map((m) => m[1] ?? "")
          .filter((t) => !GENERIC.has(t)),
      );
      for (const token of tokens) {
        checked += 1;
        expect([...names], `${file} references ${token}`).toContain(token);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
