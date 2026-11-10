import { describe, expect, it } from "vitest";
import { encodeModel } from "#model-encode.js";

describe("encodeModel", () => {
  it("cursor: thinking families get the effort as the listed suffix, max is xhigh", () => {
    expect(encodeModel("cursor", "claude-sonnet-5-5", "high")).toBe("claude-sonnet-5-5-high");
    expect(encodeModel("cursor", "claude-sonnet-5-5", "max")).toBe("claude-sonnet-5-5-xhigh");
    expect(encodeModel("cursor", "cursor-grok-4.6", "medium")).toBe("cursor-grok-4.6-medium");
    expect(encodeModel("cursor", "claude-opus-5-5", "low")).toBe("claude-opus-5-5-low");
  });

  it("changing effort with the model held constant changes the id", () => {
    const ids = (["low", "medium", "high", "max"] as const).map((e) => encodeModel("cursor", "claude-sonnet-5-5", e));
    expect(new Set(ids).size).toBe(4);
  });

  it("leaves bare ids alone: composer, inherit, muse, other providers", () => {
    expect(encodeModel("cursor", "composer-2.5", "high")).toBe("composer-2.5");
    expect(encodeModel("cursor", "inherit", "high")).toBe("inherit");
    expect(encodeModel("muse", "muse-spark-1.3-contributor", "high")).toBe("muse-spark-1.3-contributor");
    expect(encodeModel("claude", "claude-sonnet-5-5", "high")).toBe("claude-sonnet-5-5");
  });

  it("keeps an id that already carries a suffix (legacy cells)", () => {
    expect(encodeModel("cursor", "claude-sonnet-5-5-high", "max")).toBe("claude-sonnet-5-5-high");
    expect(encodeModel("cursor", "cursor-grok-4.6-xhigh", "low")).toBe("cursor-grok-4.6-xhigh");
  });
});
