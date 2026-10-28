import { TypedInMemoryProvider } from "@openfeature/server-sdk";

import { buildOpenFeatureFlagDefinitions, type FlagValue } from "./memory.js";

export function createMemoryProvider(flags: Record<string, FlagValue>) {
  return new TypedInMemoryProvider(
    buildOpenFeatureFlagDefinitions(flags) as ConstructorParameters<typeof TypedInMemoryProvider>[0],
  );
}
