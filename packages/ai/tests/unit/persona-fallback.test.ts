import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function tableFirstColumn(path: string): string[] {
  const raw = readFileSync(join(kitDir(), path), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.startsWith("| "))
    .slice(2)
    .map((line) => line.split("|")[1]?.trim() ?? "");
}

describe("persona-review fallback generics", () => {
  it("names the same personas as personas.template.md", () => {
    const fallback = tableFirstColumn("skills/persona-review/SKILL.md");
    const template = tableFirstColumn("personas.template.md");
    expect(fallback.length).toBeGreaterThan(0);
    expect([...fallback].sort()).toEqual([...template].sort());
  });
});
