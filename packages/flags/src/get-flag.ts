import type { Client } from "@openfeature/server-sdk";

import type { FlagValue } from "#memory.js";
import type { FlagRegistry } from "./registry.js";

export type FlagReturnValue<T extends FlagValue> = T extends boolean
  ? boolean
  : T extends string
    ? string
    : T extends number
      ? number
      : FlagValue;

export async function getFlag<T extends Record<string, FlagValue>, K extends keyof T & string>(
  client: Client,
  registry: FlagRegistry<T>,
  key: K,
): Promise<FlagReturnValue<T[K]>> {
  const defaultValue = registry.flags[key];
  if (typeof defaultValue === "boolean") {
    return (await client.getBooleanValue(key, defaultValue)) as FlagReturnValue<T[K]>;
  }
  if (typeof defaultValue === "string") {
    return (await client.getStringValue(key, defaultValue)) as FlagReturnValue<T[K]>;
  }
  return (await client.getNumberValue(key, defaultValue as number)) as FlagReturnValue<T[K]>;
}
