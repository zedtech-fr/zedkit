// Original work by the same author.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { err, ok, tryCatch, type Result } from "@zedkit/core";

export type KitManifest = {
  /** Preset name -> skill names, or "*" for every skill in the kit. */
  presets: Record<string, string[] | "*">;
  /** Subagent names (files in `agents/`). */
  agents: string[];
  /** Command names (files in `commands/`). Absent means none. */
  commands?: string[];
};

/** Absolute path of the bundled kit (same relative spot from `src/` and `dist/`). */
export function kitDir(): string {
  return fileURLToPath(new URL("../kit/", import.meta.url));
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function readManifest(dir: string = kitDir()): Result<KitManifest> {
  const read = tryCatch(() => JSON.parse(readFileSync(`${dir}/kit.json`, "utf8")) as unknown);
  if (!read.ok) {
    return err(new Error(`cannot read kit.json in ${dir}: ${read.error.message}`));
  }
  const data = read.value as { presets?: Record<string, unknown>; agents?: unknown; commands?: unknown } | null;
  const presets = data?.presets;
  if (!presets || typeof presets !== "object" || !isStringList(data?.agents)) {
    return err(new Error("kit.json needs `presets` (object) and `agents` (string list)"));
  }
  if (data.commands !== undefined && !isStringList(data.commands)) {
    return err(new Error("kit.json `commands` must be a string list"));
  }
  for (const [name, value] of Object.entries(presets)) {
    if (value !== "*" && !isStringList(value)) {
      return err(new Error(`kit.json preset "${name}" must be a string list or "*"`));
    }
  }
  return ok({
    presets: presets as KitManifest["presets"],
    agents: data.agents,
    ...(data.commands !== undefined && { commands: data.commands as string[] }),
  });
}
