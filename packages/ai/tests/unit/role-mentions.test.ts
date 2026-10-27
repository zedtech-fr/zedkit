import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";
import { lensTableRows, skillDirs } from "./helpers.js";

// Upstream skill borrowed as an excerpt, never vendored (see skills/pr/CREDITS.md).
const UPSTREAM = new Set(["show-me"]);
// Frontmatter field words, not kit names, in reversed mentions.
const FIELDS = new Set(["model", "description"]);

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
  it("resolves every role mention, either word order, to that kind", () => {
    // Singular or plural role word, before or after the name.
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const byKind = {
      skill: new Set(skillDirs()),
      agent: new Set(manifest.value.agents),
      command: new Set(manifest.value.commands ?? []),
      lens: new Set(lensTableRows().map((cells) => cells[1] ?? "")),
    };
    let checked = 0;
    for (const file of kitMarkdown()) {
      const raw = readFileSync(file, "utf8");
      const mentions = new Set(
        [...raw.matchAll(/`([a-z][a-z0-9-]*)` (skill|agent|command|lens)s?/gu)]
          .map((m) => `${m[1] ?? ""} ${m[2] ?? ""}`)
          .concat(
            [...raw.matchAll(/(skill|agent|command|lens)s? `([a-z][a-z0-9-]*)`/gu)].map(
              (m) => `${m[2] ?? ""} ${m[1] ?? ""}`,
            ),
          )
          .filter((key) => {
            const name = key.split(" ")[0] ?? "";
            return !UPSTREAM.has(name) && !FIELDS.has(name);
          }),
      );
      for (const key of mentions) {
        const [name, kind] = key.split(" ") as [string, keyof typeof byKind];
        checked += 1;
        expect([...byKind[kind]], `${file} mentions ${key}`).toContain(name);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("keeps every non-directory entry in skills/ a LICENSE file", () => {
    const strays = readdirSync(join(kitDir(), "skills"), { withFileTypes: true })
      .filter((entry) => !entry.isDirectory() && !entry.name.startsWith("LICENSE-"))
      .map((entry) => entry.name);
    expect(strays).toEqual([]);
  });
});
