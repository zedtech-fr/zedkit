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
});
