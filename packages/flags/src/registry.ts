import { type FlagValue } from "./memory.js";

export type FlagRegistry<T extends Record<string, FlagValue>> = {
  flags: T;
};

export function defineFlagRegistry<const T extends Record<string, FlagValue>>(flags: T): FlagRegistry<T> {
  return { flags };
}

export function mergeFlagValues<T extends Record<string, FlagValue>>(
  registry: FlagRegistry<T>,
  overrides: Record<string, FlagValue>,
): Record<string, FlagValue> {
  return { ...registry.flags, ...overrides };
}
