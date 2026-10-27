import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function skillRule(): string {
  const raw = readFileSync(join(kitDir(), "skills", "use-zedkit", "SKILL.md"), "utf8");
  const quote = raw
    .split("\n")
    .filter((line) => line.startsWith("> "))
    .map((line) => line.slice(2));
  expect(quote.length).toBeGreaterThan(0);
  return normalize(quote.join(" "));
}

function readmeSnippet(): string {
  const readme = readFileSync(
    fileURLToPath(new URL("../../../../README.md", import.meta.url)),
    "utf8",
  );
  const at = readme.indexOf("<!-- use-zedkit-snippet:");
  expect(at, "snippet marker").toBeGreaterThanOrEqual(0);
  const fence = /```md\n([\s\S]*?)```/.exec(readme.slice(at));
  expect(fence?.[1], "snippet fence").toBeDefined();
  return normalize(fence?.[1] ?? "");
}

describe("use-zedkit mirror", () => {
  it("keeps the root README consumer snippet identical to the skill core rule", () => {
    expect(readmeSnippet()).toBe(skillRule());
  });
});
