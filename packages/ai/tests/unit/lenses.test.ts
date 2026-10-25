import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

type LensRow = {
  lens: string;
  runner: string;
  status: string;
  trigger: string;
  mandatory: string;
  output: string;
};

function registry(): LensRow[] {
  const raw = readFileSync(join(kitDir(), "skills/review/lenses.md"), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.startsWith("| "))
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((cells) => cells[1] !== "Lens")
    .map((cells) => ({
      lens: cells[1] ?? "",
      runner: cells[2] ?? "",
      status: cells[3] ?? "",
      trigger: cells[4] ?? "",
      mandatory: cells[5] ?? "",
      output: cells[6] ?? "",
    }));
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

  it("every row names a real trigger and output shape", () => {
    const rows = registry();
    expect(rows.length).toBeGreaterThanOrEqual(14);
    for (const row of rows) {
      expect(row.lens.length, "lens name").toBeGreaterThan(0);
      expect(row.trigger.length, `${row.lens} trigger`).toBeGreaterThan(0);
      expect(row.output.length, `${row.lens} output`).toBeGreaterThan(0);
      expect(["exists", "planned"], `${row.lens} status`).toContain(row.status);
      expect(["yes", "when triggered", "optional"], `${row.lens} mandatory`).toContain(
        row.mandatory,
      );
    }
  });

  it("every existing runner resolves to a skill or agent", () => {
    for (const row of registry().filter((r) => r.status === "exists")) {
      expect(runnerExists(row.runner), `lens ${row.lens}`).toBe(true);
    }
  });
});
