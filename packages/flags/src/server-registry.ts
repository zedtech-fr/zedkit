import { createMemoryProvider } from "./server-provider.js";
import { type FlagRegistry } from "./registry.js";
import { type FlagValue } from "./memory.js";

export function memoryProviderFromRegistry<T extends Record<string, FlagValue>>(registry: FlagRegistry<T>) {
  return createMemoryProvider(registry.flags);
}
