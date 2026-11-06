import { afterEach, describe, expect, it, vi } from "vitest";
import { createConsoleTracker, createMemoryTracker, createNoopTracker } from "#index.js";

type DemoEvents = {
  item_added: { id: string };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createNoopTracker", () => {
  it("ignores identify, capture, and reset", () => {
    const tracker = createNoopTracker<DemoEvents>();
    tracker.identify("user-1");
    tracker.capture("item_added", { id: "a" });
    tracker.reset();
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

describe("createConsoleTracker", () => {
  it("writes identify, capture, and reset to console", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const tracker = createConsoleTracker<DemoEvents>();
    tracker.identify("user-1", { plan: "free" });
    tracker.identify("user-2");
    tracker.capture("item_added", { id: "x" });
    tracker.reset();
    expect(info).toHaveBeenCalledWith("[tracker] identify", "user-1", { plan: "free" });
    expect(info).toHaveBeenCalledWith("[tracker] identify", "user-2", {});
    expect(info).toHaveBeenCalledWith("[tracker] capture", "item_added", { id: "x" });
    expect(info).toHaveBeenCalledWith("[tracker] reset");
  });
});
