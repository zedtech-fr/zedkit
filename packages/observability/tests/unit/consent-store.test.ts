import { describe, expect, it } from "vitest";
import {
  createLocalStorageConsentStore,
  createMemoryConsentStore,
  isCategoryGranted,
} from "#consent/index.js";

describe("createMemoryConsentStore", () => {
  it("starts empty and persists writes", () => {
    const store = createMemoryConsentStore();
    expect(store.read()).toBeNull();
    store.write({ analytics: true, marketing: false });
    expect(store.read()?.analytics).toBe(true);
    expect(isCategoryGranted(store.read(), "analytics")).toBe(true);
    expect(isCategoryGranted(store.read(), "marketing")).toBe(false);
  });
});

describe("createLocalStorageConsentStore", () => {
  it("hydrates from storage", () => {
    const bag = new Map<string, string>();
    const storage = {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => void bag.set(key, value),
    };
    bag.set(
      "consent",
      JSON.stringify({ analytics: true, marketing: true, updatedAt: 1 }),
    );
    const store = createLocalStorageConsentStore({ key: "consent", storage });
    expect(store.read()?.analytics).toBe(true);
  });

  it("ignores empty, invalid, and incomplete storage values", () => {
    const bag = new Map<string, string>();
    const storage = {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => void bag.set(key, value),
    };
    bag.set("empty", "");
    expect(createLocalStorageConsentStore({ key: "empty", storage }).read()).toBeNull();
    bag.set("bad", "{");
    expect(createLocalStorageConsentStore({ key: "bad", storage }).read()).toBeNull();
    bag.set("partial", JSON.stringify({ analytics: true }));
    expect(createLocalStorageConsentStore({ key: "partial", storage }).read()).toBeNull();
  });

  it("writes back to storage and notifies subscribers", () => {
    const bag = new Map<string, string>();
    const storage = {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => void bag.set(key, value),
    };
    const store = createLocalStorageConsentStore({ key: "consent", storage });
    let ticks = 0;
    const stop = store.subscribe(() => {
      ticks += 1;
    });
    store.write({ analytics: false, marketing: true });
    expect(store.read()?.marketing).toBe(true);
    expect(JSON.parse(bag.get("consent") ?? "{}").marketing).toBe(true);
    expect(ticks).toBe(1);
    stop();
  });
});

describe("isCategoryGranted", () => {
  it("is false when no record exists", () => {
    expect(isCategoryGranted(null, "analytics")).toBe(false);
  });
});
