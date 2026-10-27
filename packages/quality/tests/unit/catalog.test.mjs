import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function needSections() {
  const catalog = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "CATALOG.md"),
    "utf8",
  );
  return catalog
    .split(/^## /m)
    .slice(1)
    .map((body) => ({
      name: (body.split("\n")[0] ?? "").trim(),
      status: /^- Status: (\w+)$/m.exec(body)?.[1] ?? "",
      body,
    }));
}

describe("catalog beta evidence", () => {
  it("documents every beta need with a fenced example", () => {
    const sections = needSections();
    expect(sections.length).toBeGreaterThan(0);
    const beta = sections.filter((s) => s.status === "beta");
    expect(beta.length).toBeGreaterThan(0);
    for (const section of beta) {
      expect(section.body, `${section.name} example`).toContain("```");
    }
  });
});
