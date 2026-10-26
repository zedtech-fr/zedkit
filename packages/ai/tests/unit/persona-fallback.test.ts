import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function tableFirstColumn(path: string): string[] {
  const raw = readFileSync(join(kitDir(), path), "utf8");
  const lines = raw.split("\n");
  // Only the persona table: rows under the `| Persona |` header, stopping at
  // the first non-table line, so a later table never mixes its rows in.
  // The `|---` separator never matches `| `, so no row is skipped.
  const head = lines.findIndex((line) => line.startsWith("| Persona |"));
  if (head < 0) throw new Error(`${path} has no persona table`);
  const rows: string[] = [];
  for (const line of lines.slice(head + 1)) {
    if (!line.startsWith("|")) break;
    if (line.startsWith("| ")) rows.push(line.split("|")[1]?.trim() ?? "");
  }
  return rows;
}

describe("persona-review fallback generics", () => {
  it("names the same personas as personas.template.md", () => {
    const fallback = tableFirstColumn("skills/persona-review/SKILL.md");
    const template = tableFirstColumn("personas.template.md");
    expect(fallback.length).toBeGreaterThan(0);
    expect([...fallback].sort()).toEqual([...template].sort());
  });
});
