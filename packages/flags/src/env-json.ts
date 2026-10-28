import { tryCatch } from "@zedtech/zedkit-core";

import { type FlagValue } from "#memory.js";

const FLAG_VALUE = (value: unknown): value is FlagValue =>
  typeof value === "boolean" || typeof value === "string" || typeof value === "number";

export function parseFlagsJson(raw: string | undefined | null): Record<string, FlagValue> {
  const trimmed = raw?.trim();
  if (!trimmed) return {};
  const parsed = tryCatch(() => JSON.parse(trimmed) as unknown);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    return {};
  }
  const out: Record<string, FlagValue> = {};
  for (const [key, value] of Object.entries(parsed.value)) {
    if (FLAG_VALUE(value)) out[key] = value;
  }
  return out;
}

export function loadFlagsFromEnv(
  env: Record<string, string | undefined> = process.env,
  envVar = "ZEDKIT_FLAGS_JSON",
): Record<string, FlagValue> {
  return parseFlagsJson(env[envVar]);
}
