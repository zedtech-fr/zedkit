import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "#frontmatter.js";
import { kitDir } from "#kit.js";

function catalogWrites(): Map<string, string> {
  const raw = readFileSync(
    fileURLToPath(new URL("../../../../docs/agents-catalog.md", import.meta.url)),
    "utf8",
  );
  const rows = new Map<string, string>();
  for (const line of raw.split("\n")) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const name = cells[1]?.replaceAll("`", "");
    if (name) rows.set(name, cells[3] ?? "");
  }
  return rows;
}

describe("agent write guards", () => {
  it("matches the catalog Writes column with frontmatter disallowedTools", () => {
    const writes = catalogWrites();
    expect(writes.size).toBeGreaterThan(0);
    for (const [name, column] of writes) {
      const text = readFileSync(`${kitDir()}/agents/${name}.md`, "utf8");
      const parsed = parseFrontmatter(text);
      if (!parsed.ok) throw parsed.error;
      const guards = parsed.value.data["disallowedTools"];
      if (column === "no") {
        expect(typeof guards === "string" && guards.includes("Write"), name).toBe(true);
      } else {
        expect(guards, name).toBeUndefined();
      }
    }
  });
});
