import { tryCatch } from "@zedtech/zedkit-core";

import { type FlagValue } from "#memory.js";

export const FLAG_OVERRIDE_STORAGE_KEY = "zedkit-flag-overrides";

let overrideSnapshot: Record<string, FlagValue> = {};
let overrideSnapshotRaw = "";

function invalidateOverrideSnapshot() {
  overrideSnapshotRaw = "";
}

export function readFlagOverrides(storage: Pick<Storage, "getItem"> | null | undefined): Record<string, FlagValue> {
  if (!storage) return {};
  const raw = storage.getItem(FLAG_OVERRIDE_STORAGE_KEY);
  if (!raw?.trim()) return {};
  const parsed = tryCatch(() => JSON.parse(raw) as unknown);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    return {};
  }
  const out: Record<string, FlagValue> = {};
  for (const [key, value] of Object.entries(parsed.value)) {
    if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
      out[key] = value;
    }
  }
  return out;
}

export function flagOverridesSnapshot(storage: Pick<Storage, "getItem"> | null | undefined): Record<string, FlagValue> {
  const raw = storage?.getItem(FLAG_OVERRIDE_STORAGE_KEY) ?? "";
  if (raw === overrideSnapshotRaw) return overrideSnapshot;
  overrideSnapshotRaw = raw;
  overrideSnapshot = readFlagOverrides(storage);
  return overrideSnapshot;
}

export function writeFlagOverride(
  storage: Storage,
  flagKey: string,
  value: FlagValue | null,
): Record<string, FlagValue> {
  const current = readFlagOverrides(storage);
  if (value === null) {
    delete current[flagKey];
  } else {
    current[flagKey] = value;
  }
  storage.setItem(FLAG_OVERRIDE_STORAGE_KEY, JSON.stringify(current));
  invalidateOverrideSnapshot();
  if (typeof globalThis.dispatchEvent === "function") {
    globalThis.dispatchEvent(new Event("zedkit-flag-overrides"));
  }
  return current;
}

export function mergeFlagValue<T extends FlagValue>(flagKey: string, evaluated: T, overrides: Record<string, FlagValue>): T {
  if (!(flagKey in overrides)) return evaluated;
  const override = overrides[flagKey];
  if (typeof evaluated === "boolean" && typeof override === "boolean") return override as T;
  if (typeof evaluated === "string" && typeof override === "string") return override as T;
  if (typeof evaluated === "number" && typeof override === "number") return override as T;
  return evaluated;
}

export function subscribeFlagOverrides(onStoreChange: () => void): () => void {
  if (typeof globalThis.addEventListener !== "function") return () => {};
  const handler = () => onStoreChange();
  globalThis.addEventListener("storage", handler);
  globalThis.addEventListener("zedkit-flag-overrides", handler);
  return () => {
    globalThis.removeEventListener("storage", handler);
    globalThis.removeEventListener("zedkit-flag-overrides", handler);
  };
}
