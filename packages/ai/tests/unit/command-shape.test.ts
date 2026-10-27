import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function commandFiles(): string[] {
  return readdirSync(join(kitDir(), "commands")).filter((f) => f.endsWith(".md"));
}

function bodyOf(file: string): string {
  const raw = readFileSync(join(kitDir(), "commands", file), "utf8");
  const end = raw.indexOf("---", 3);
  expect(end, `${file} frontmatter`).toBeGreaterThanOrEqual(0);
  return raw.slice(end + 3).trim();
}

describe("command shape", () => {
  it("routes every command to its same-named skill with the $ARGUMENTS contract", () => {
    const files = commandFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const name = file.replace(/\.md$/, "");
      expect(bodyOf(file), file).toBe(
        `Run the \`${name}\` skill on \`$ARGUMENTS\` (the text after the command, or the current context when empty).`,
      );
    }
  });
});
