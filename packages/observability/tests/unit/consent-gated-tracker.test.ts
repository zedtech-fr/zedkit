import { describe, expect, it, vi } from "vitest";
import { createMemoryTracker } from "#index.js";
import { createConsentGatedTracker, runConsentGatedLoader } from "#consent/index.js";
import { createMemoryConsentStore } from "#consent/index.js";

type Events = { ping: { ok: boolean } };

describe("createConsentGatedTracker", () => {
  it("drops capture until analytics is granted", () => {
    const store = createMemoryConsentStore();
    const { tracker, captured } = createMemoryTracker<Events>();
    const gated = createConsentGatedTracker(tracker, store, "analytics");
    gated.identify("user-1");
    gated.capture("ping", { ok: true });
    expect(captured).toEqual([]);
    store.write({ analytics: true, marketing: false });
    gated.identify("user-1", { plan: "free" });
    gated.capture("ping", { ok: true });
    expect(captured).toHaveLength(1);
  });

  it("always forwards reset even without consent", () => {
    const store = createMemoryConsentStore();
    const reset = vi.fn();
    const gated = createConsentGatedTracker<Events>(
      { identify: () => undefined, capture: () => undefined, reset },
      store,
      "analytics",
    );
    gated.reset();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("runConsentGatedLoader", () => {
  it("runs load when consent flips on and cleans up on revoke", () => {
    const store = createMemoryConsentStore();
    const load = vi.fn(() => () => undefined);
    const unsubscribe = runConsentGatedLoader(store, "analytics", load);
    expect(load).not.toHaveBeenCalled();
    store.write({ analytics: true, marketing: false });
    expect(load).toHaveBeenCalledTimes(1);
    store.write({ analytics: false, marketing: false });
    unsubscribe();
  });
});
