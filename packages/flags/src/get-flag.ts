import type { Client } from "@openfeature/server-sdk";

import type { FlagRegistry } from "./registry.js";
import type { FlagValue } from "./memory.js";

export async function getFlag<T extends Record<string, FlagValue>, K extends keyof T & string>(
  client: Client,
  registry: FlagRegistry<T>,
  key: K,
): Promise<T[K]> {
  const defaultValue = registry.flags[key];
  if (typeof defaultValue === "boolean") {
    return (await client.getBooleanValue(key, defaultValue)) as T[K];
  }
  if (typeof defaultValue === "string") {
    return (await client.getStringValue(key, defaultValue)) as T[K];
  }
  return (await client.getNumberValue(key, defaultValue as number)) as T[K];
}
