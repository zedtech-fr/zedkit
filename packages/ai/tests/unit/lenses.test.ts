import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

type LensRow = { lens: string; runner: string; status: string; mandatory: string };

function registry(): LensRow[] {
  const raw = readFileSync(join(kitDir(), "skills/review/lenses.md"), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.startsWith("| "))
    .slice(1) // header
    .filter((line) => !line.startsWith("|---") && !line.startsWith("| Lens"))
    .map((line) => {
      const cells = line.split("|").map((c) => c.trim());
      return {
        lens: cells[1] ?? "",
        runner: cells[2] ?? "",
        status: cells[3] ?? "",
        mandatory: cells[5] ?? "",
      };
    });
}

function runnerExists(runner: string): boolean {
  const names = [...runner.matchAll(/`([\w-]+)`/g)].map((m) => m[1] ?? "");
  return names.some(
    (name) =>
      existsSync(join(kitDir(), "skills", name, "SKILL.md")) ||
      existsSync(join(kitDir(), "agents", `${name}.md`)),
  );
}

describe("lens registry", () => {
  it("requires the minimum lens set", () => {
    const mandatory = registry()
      .filter((row) => row.mandatory === "yes")
      .map((row) => row.lens);
    expect(mandatory).toEqual(
      expect.arrayContaining(["code", "ponytail", "persona", "quality gate"]),
    );
  });

  it("every existing runner resolves to a skill or agent", () => {
    for (const row of registry().filter((r) => r.status === "exists")) {
      expect(runnerExists(row.runner), `lens ${row.lens}`).toBe(true);
    }
  });

  it("every row has a trigger and an output", () => {
    const raw = readFileSync(join(kitDir(), "skills/review/lenses.md"), "utf8");
    for (const row of registry()) {
      expect(row.lens.length).toBeGreaterThan(0);
      expect(raw).toContain(`| ${row.lens} |`);
    }
    expect(registry().length).toBeGreaterThanOrEqual(14);
  });
});
