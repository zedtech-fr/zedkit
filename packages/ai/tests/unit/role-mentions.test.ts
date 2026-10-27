import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";
import { lensTableRows } from "./helpers.js";

// Upstream skill borrowed as an excerpt, never vendored (see skills/pr/CREDITS.md).
const UPSTREAM = new Set(["show-me"]);

function kitMarkdown(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) out.push(full);
    }
  };
  walk(kitDir());
  return out;
}

describe("role mentions", () => {
  it("resolves every `name` skill|agent|command|lens mention to that kind", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const byKind = {
      skill: new Set(readdirSync(join(kitDir(), "skills"))),
      agent: new Set(manifest.value.agents),
      command: new Set(manifest.value.commands ?? []),
      lens: new Set(lensTableRows().map((cells) => cells[1] ?? "")),
    };
    let checked = 0;
    for (const file of kitMarkdown()) {
      const raw = readFileSync(file, "utf8");
      const mentions = new Set(
        [...raw.matchAll(/`([a-z][a-z0-9-]*)` (skill|agent|command|lens)/gu)]
          .map((m) => `${m[1] ?? ""} ${m[2] ?? ""}`)
          .filter((key) => !UPSTREAM.has(key.split(" ")[0] ?? "")),
      );
      for (const key of mentions) {
        const [name, kind] = key.split(" ") as [string, keyof typeof byKind];
        checked += 1;
        expect([...byKind[kind]], `${file} mentions ${key}`).toContain(name);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
