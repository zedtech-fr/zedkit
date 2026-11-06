import { describe, expect, it } from "vitest";

import { assertNoValueArbitraries } from "./no-arbitraries.js";

describe("assertNoValueArbitraries", () => {
  it.each(["w-[4px]", "p-[13px]", "text-[#fff]", "gap-[2px]"])("flags %s", (className) => {
    expect(() => assertNoValueArbitraries(className)).toThrow();
  });

  it.each([
    "gap-4",
    "max-w-full",
    "data-[state=open]",
    "[--radix-select-content-available-height]",
    "[var(--radix-popper-available-height)]",
  ])("passes %s", (className) => {
    expect(() => assertNoValueArbitraries(className)).not.toThrow();
  });
});
