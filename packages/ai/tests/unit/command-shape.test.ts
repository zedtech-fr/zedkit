import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function commandFiles(): string[] {
  return readdirSync(join(kitDir(), "commands")).filter((f) =>
    f.endsWith(".md"),
  );
}

function bodyOf(file: string): string {
  const raw = readFileSync(join(kitDir(), "commands", file), "utf8");
  const end = raw.indexOf("---", 3);
  expect(end, `${file} frontmatter`).toBeGreaterThanOrEqual(0);
  return raw.slice(end + 3).trim();
}

describe("command shape", () => {
  const deprecation = (name: string) =>
    `Deprecated: use \`/zedkit-ai <request>\`. Forwarding as route \`${name}\`.`;

  const defaultBody = (name: string) =>
    `${deprecation(name)} Run the \`${name}\` skill on \`$ARGUMENTS\` (the text after the command, or the current context when empty).`;

  it("routes every command to its same-named skill with the $ARGUMENTS contract", () => {
    const files = commandFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const name = file.replace(/\.md$/, "");
      const body = bodyOf(file);
      if (name === "setup-ai") {
        expect(
          body.startsWith(
            `${deprecation(name)} Before anything else, tell the user`,
          ),
          file,
        ).toBe(true);
        expect(body, file).toContain("Tell the user first");
        expect(body, file).toContain("before any tool call");
        expect(body, file).toContain(
          "Then run the `setup-ai` skill on `$ARGUMENTS`",
        );
        continue;
      }
      if (name === "improve-config") {
        expect(body, file).toBe(
          `${deprecation(name)} Run the \`rules-upkeep\` skill (\`improve-config\`) on \`$ARGUMENTS\` (the text after the command, or the current context when empty).`,
        );
        continue;
      }
      if (name === "zedkit-ai") {
        expect(body, file).not.toContain("Deprecated:");
        expect(body, file).toContain("before any tool call");
        expect(body, file).toContain(
          "run the `zedkit-ai` skill on `$ARGUMENTS`",
        );
        continue;
      }
      expect(body, file).toBe(defaultBody(name));
    }
  });
});
