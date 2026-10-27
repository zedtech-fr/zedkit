import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function usageFlags(): string[] {
  const source = readFileSync(
    fileURLToPath(new URL("../../src/cli.ts", import.meta.url)),
    "utf8",
  );
  const usage = /const USAGE = `([\s\S]*?)`;/u.exec(source)?.[1] ?? "";
  expect(usage.length, "USAGE block").toBeGreaterThan(0);
  return [...new Set([...usage.matchAll(/--[a-z][a-z0-9-]*/gu)].map((m) => m[0]))];
}

describe("cli flags documentation", () => {
  it("documents every USAGE flag in the package README", () => {
    const flags = usageFlags();
    expect(flags.length).toBeGreaterThan(0);
    const readme = readFileSync(
      fileURLToPath(new URL("../../README.md", import.meta.url)),
      "utf8",
    );
    for (const flag of flags) {
      expect(readme, `README missing ${flag}`).toContain(flag);
    }
  });
});
