import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function kitText(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8").toLowerCase();
}

describe("loading and feedback", () => {
  it("requires named loading with state-kept retry in ui-designer", () => {
    const text = kitText("agents/ui-designer.md");
    expect(text).toContain("zero naked spinners");
    expect(text).toContain("retry keeps state");
  });

  it("states the loading rule with its refusal example in the ui lens", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("zero naked spinners");
    expect(text).toContain("a spinner with no label");
  });

  it("tells the stressed persona that no wait is ever naked", () => {
    const text = kitText("personas.template.md");
    expect(text).toContain("zero naked spinners");
    expect(text).toContain("stressed user");
  });
});
