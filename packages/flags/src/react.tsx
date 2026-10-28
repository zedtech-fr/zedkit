"use client";

import { OpenFeatureProvider, useBooleanFlagValue } from "@openfeature/react-sdk";
import { OpenFeature, TypedInMemoryProvider } from "@openfeature/web-sdk";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { buildOpenFeatureFlagDefinitions } from "./memory.js";
import { mergeFlagValue, flagOverridesSnapshot, subscribeFlagOverrides } from "./overrides.js";
import { type FlagRegistry } from "./registry.js";
import { type FlagValue } from "./memory.js";

export { OpenFeatureProvider, useBooleanFlagValue, useNumberFlagValue, useStringFlagValue } from "@openfeature/react-sdk";
export { OpenFeature, TypedInMemoryProvider } from "@openfeature/web-sdk";

export type ZedkitFlagsProviderProps<T extends Record<string, FlagValue>> = {
  registry: FlagRegistry<T>;
  children: ReactNode;
};

export function ZedkitFlagsProvider<T extends Record<string, FlagValue>>({
  registry,
  children,
}: ZedkitFlagsProviderProps<T>): ReactNode {
  const provider = useMemo(
    () =>
      new TypedInMemoryProvider(
        buildOpenFeatureFlagDefinitions(registry.flags) as ConstructorParameters<typeof TypedInMemoryProvider>[0],
      ),
    [registry],
  );
  useEffect(() => {
    OpenFeature.setProvider(provider);
  }, [provider]);
  return <OpenFeatureProvider>{children}</OpenFeatureProvider>;
}

function useFlagOverrides(): Record<string, FlagValue> {
  const [overrides, setOverrides] = useState(() =>
    flagOverridesSnapshot(typeof localStorage === "undefined" ? null : localStorage),
  );
  useEffect(() => {
    return subscribeFlagOverrides(() => {
      setOverrides(flagOverridesSnapshot(typeof localStorage === "undefined" ? null : localStorage));
    });
  }, []);
  return overrides;
}

export function useFlag(flagKey: string, defaultValue: boolean): boolean {
  const evaluated = useBooleanFlagValue(flagKey, defaultValue);
  const overrides = useFlagOverrides();
  return mergeFlagValue(flagKey, evaluated, overrides);
}

export { defineFlagRegistry, type FlagRegistry } from "./registry.js";
export { writeFlagOverride, FLAG_OVERRIDE_STORAGE_KEY } from "./overrides.js";
