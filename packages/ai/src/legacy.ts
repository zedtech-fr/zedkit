// Original work by the same author.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { kitDir } from "./kit.js";

export type LegacyHashMap = { agents: Record<string, string[]>; commands: Record<string, string[]> };

type Hashes = LegacyHashMap;

let cached: Hashes | undefined;

function load(): Hashes {
  if (cached) return cached;
  const read = tryCatch(() => JSON.parse(readFileSync(join(kitDir(), "legacy-hashes.json"), "utf8")) as Partial<Hashes>);
  cached = { agents: read.ok ? (read.value.agents ?? {}) : {}, commands: read.ok ? (read.value.commands ?? {}) : {} };
  return cached;
}

/** The short content hash `kit/legacy-hashes.json` uses: sha256 of the LF text, first 16 hex digits. */
export function shortHash(text: string): string {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
}

/**
 * True when `text` is a copy of the kit rather than user work: the project's
 * current source for it, or any version `init` shipped before (by hash).
 */
function unionSorted(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

/** Keep every hash already on disk when git history is shallow or reset. */
export function mergeLegacyHashMaps(prior: LegacyHashMap, next: LegacyHashMap): LegacyHashMap {
  const merged: LegacyHashMap = { agents: {}, commands: {} };
  for (const kind of ["agents", "commands"] as const) {
    const names = new Set([...Object.keys(prior[kind] ?? {}), ...Object.keys(next[kind] ?? {})]);
    for (const name of names) {
      merged[kind][name] = unionSorted(prior[kind]?.[name] ?? [], next[kind]?.[name] ?? []);
    }
  }
  return merged;
}

/** Fails when regeneration would drop a recorded hash (silent deletion). */
export function legacyHashMergeIssues(prior: LegacyHashMap, merged: LegacyHashMap): string[] {
  const issues: string[] = [];
  for (const kind of ["agents", "commands"] as const) {
    for (const [name, hashes] of Object.entries(prior[kind] ?? {})) {
      const kept = merged[kind][name];
      if (hashes.length === 0) continue;
      if (!kept || kept.length === 0) {
        issues.push(`${kind}/${name}: would drop ${hashes.length} recorded hash(es)`);
        continue;
      }
      for (const hash of hashes) {
        if (!kept.includes(hash)) issues.push(`${kind}/${name}: would drop hash ${hash}`);
      }
    }
  }
  return issues;
}

export function isKitCopy(kind: "agents" | "commands", name: string, text: string, source: string | undefined): boolean {
  const normalized = text.replace(/\r\n/g, "\n");
  if (source !== undefined && normalized === source.replace(/\r\n/g, "\n")) return true;
  const known = load()[kind][name];
  return known !== undefined && known.includes(shortHash(normalized));
}
