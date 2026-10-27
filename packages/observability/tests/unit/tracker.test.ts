import { describe, expect, it } from "vitest";
import { createMemoryTracker, createNoopTracker } from "#index.js";

type DemoEvents = {
  item_added: { id: string };
};

describe("createNoopTracker", () => {
  it("ignores capture calls", () => {
    const tracker = createNoopTracker<DemoEvents>();
    tracker.capture("item_added", { id: "a" });
  });
});

describe("createMemoryTracker", () => {
  it("stores identify and capture", () => {
    const { tracker, captured, identified } = createMemoryTracker<DemoEvents>();
    tracker.identify("user-1", { plan: "free" });
    tracker.capture("item_added", { id: "x" });
    expect(identified).toEqual([{ userId: "user-1", traits: { plan: "free" } }]);
    expect(captured).toEqual([{ event: "item_added", properties: { id: "x" } }]);
  });

  it("reset clears identify and capture buffers", () => {
    const { tracker, captured, identified } = createMemoryTracker<DemoEvents>();
    tracker.identify("user-1");
    tracker.capture("item_added", { id: "x" });
    tracker.reset();
    expect(identified).toEqual([]);
    expect(captured).toEqual([]);
  });
});
