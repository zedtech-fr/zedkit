import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function kitText(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8").toLowerCase();
}

describe("gentle motion", () => {
  it("requires entry+exit motion with reduced-motion in ui-designer", () => {
    const text = kitText("agents/ui-designer.md");
    expect(text).toContain("entry and exit animated by default");
    expect(text).toContain("prefers-reduced-motion");
    expect(text).toContain("without transition is refused");
  });

  it("states the motion rule with its refusal example in the ui lens", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("gentle motion by default");
    expect(text).toContain("an overlay without transition");
  });

  it("tells both personas that motion reassures and shows where you are", () => {
    const text = kitText("personas.template.md");
    expect(text).toContain("gentle motion reassures and shows where you are");
    expect(text).toContain("stressed user");
  });

  it("gates UI merges on the ui-designer motion verdict", () => {
    const text = kitText("agents/verifier.md");
    expect(text).toContain("no ui-designer pass, no ready");
  });
});
