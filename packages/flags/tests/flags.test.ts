import { OpenFeature } from "@openfeature/server-sdk";
import { describe, expect, it } from "vitest";

import { getFlag } from "#get-flag.js";
import { loadFlagsFromEnv, parseFlagsJson } from "#env-json.js";
import { defineFlagRegistry, mergeFlagValues } from "#registry.js";
import { memoryProviderFromRegistry } from "#server-registry.js";

describe("defineFlagRegistry and getFlag", () => {
  it("reads boolean flags from an in-memory provider", async () => {
    const registry = defineFlagRegistry({ beta: false, stable: true });
    OpenFeature.setProvider(memoryProviderFromRegistry(registry));
    const client = OpenFeature.getClient();
    await expect(getFlag(client, registry, "beta")).resolves.toBe(false);
    await expect(getFlag(client, registry, "stable")).resolves.toBe(true);
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
