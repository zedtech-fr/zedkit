import { OpenFeature } from "@openfeature/server-sdk";
import { afterEach, describe, expect, it } from "vitest";

import { getFlag } from "#get-flag.js";
import { loadFlagsFromEnv, parseFlagsJson } from "#env-json.js";
import { buildOpenFeatureFlagDefinitions } from "#memory.js";
import {
  FLAG_OVERRIDE_STORAGE_KEY,
  flagOverridesSnapshot,
  mergeFlagValue,
  readFlagOverrides,
  subscribeFlagOverrides,
  writeFlagOverride,
} from "#overrides.js";
import { defineFlagRegistry, mergeFlagValues } from "#registry.js";
import { memoryProviderFromRegistry } from "#server-registry.js";
import { createMemoryProvider } from "#server-provider.js";

describe("defineFlagRegistry and getFlag", () => {
  it("reads boolean flags from an in-memory provider", async () => {
    const registry = defineFlagRegistry({ beta: false, stable: true });
    OpenFeature.setProvider(memoryProviderFromRegistry(registry));
    const client = OpenFeature.getClient();
    await expect(getFlag(client, registry, "beta")).resolves.toBe(false);
    await expect(getFlag(client, registry, "stable")).resolves.toBe(true);
  });

  it("reads string and number flags from an in-memory provider", async () => {
    const registry = defineFlagRegistry({ theme: "mist", retries: 3 });
    OpenFeature.setProvider(memoryProviderFromRegistry(registry));
    const client = OpenFeature.getClient();
    await expect(getFlag(client, registry, "theme")).resolves.toBe("mist");
    await expect(getFlag(client, registry, "retries")).resolves.toBe(3);
  });

  it("returns the provider value when it differs from the registry default", async () => {
    const registry = defineFlagRegistry({ beta: false });
    OpenFeature.setProvider(createMemoryProvider({ beta: true }));
    const client = OpenFeature.getClient();
    await expect(getFlag(client, registry, "beta")).resolves.toBe(true);
  });
});

describe("buildOpenFeatureFlagDefinitions", () => {
  it("builds variants for boolean, string and number defaults", () => {
    expect(buildOpenFeatureFlagDefinitions({ on: true, theme: "mist", n: 2 })).toEqual({
      on: { variants: { on: true, off: false }, defaultVariant: "on", disabled: false },
      theme: { variants: { value: "mist" }, defaultVariant: "value", disabled: false },
      n: { variants: { value: 2 }, defaultVariant: "value", disabled: false },
    });
  });
});

describe("parseFlagsJson", () => {
  it("returns an empty object for invalid JSON", () => {
    expect(parseFlagsJson("{")).toEqual({});
  });

  it("keeps boolean and string values", () => {
    expect(parseFlagsJson('{"a":true,"b":"on"}')).toEqual({ a: true, b: "on" });
  });
});

describe("loadFlagsFromEnv", () => {
  it("reads ZEDKIT_FLAGS_JSON", () => {
    expect(loadFlagsFromEnv({ ZEDKIT_FLAGS_JSON: '{"x":1}' })).toEqual({ x: 1 });
  });
});

describe("mergeFlagValues", () => {
  it("overrides registry defaults", () => {
    const registry = defineFlagRegistry({ feature: false });
    expect(mergeFlagValues(registry, { feature: true })).toEqual({ feature: true });
  });
});

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const store = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("flag overrides", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("ignores missing storage, bad JSON, arrays and non-flag values", () => {
    expect(readFlagOverrides(null)).toEqual({});
    expect(readFlagOverrides(memoryStorage({ [FLAG_OVERRIDE_STORAGE_KEY]: "{" }))).toEqual({});
    expect(readFlagOverrides(memoryStorage({ [FLAG_OVERRIDE_STORAGE_KEY]: "[1]" }))).toEqual({});
    expect(readFlagOverrides(memoryStorage({ [FLAG_OVERRIDE_STORAGE_KEY]: "1" }))).toEqual({});
    expect(
      readFlagOverrides(memoryStorage({ [FLAG_OVERRIDE_STORAGE_KEY]: '{"a":true,"b":{"x":1},"c":"on","d":2}' })),
    ).toEqual({ a: true, c: "on", d: 2 });
  });

  it("reuses the snapshot while the stored JSON is unchanged", () => {
    const storage = memoryStorage({ [FLAG_OVERRIDE_STORAGE_KEY]: '{"a":true}' });
    const first = flagOverridesSnapshot(storage);
    const second = flagOverridesSnapshot(storage);
    expect(second).toBe(first);
    expect(first).toEqual({ a: true });
  });

  it("writes, deletes, and ignores a type-mismatched override", () => {
    const storage = memoryStorage();
    expect(writeFlagOverride(storage, "theme", "volt")).toEqual({ theme: "volt" });
    expect(writeFlagOverride(storage, "theme", null)).toEqual({});
    expect(mergeFlagValue("beta", false, { beta: true })).toBe(true);
    expect(mergeFlagValue("theme", "mist", { theme: "volt" })).toBe("volt");
    expect(mergeFlagValue("n", 1, { n: 2 })).toBe(2);
    expect(mergeFlagValue("beta", false, { beta: "on" })).toBe(false);
  });

  it("notifies subscribers until they unsubscribe", () => {
    localStorage.clear();
    let n = 0;
    const stop = subscribeFlagOverrides(() => {
      n += 1;
    });
    writeFlagOverride(localStorage, "demo", true);
    expect(n).toBe(1);
    stop();
    writeFlagOverride(localStorage, "demo", false);
    expect(n).toBe(1);
  });
});
