// Original work by the same author.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { kitDir } from "./kit.js";

export type LegacyHashMap = {
  agents: Record<string, string[]>;
  commands: Record<string, string[]>;
  /** Skill file hashes keyed by `<skill>/<posix-rel-path>`. Absent in older files. */
  skills?: Record<string, string[]>;
};

export type LegacyHashFileSnapshot =
  | { status: "missing" }
  | { status: "invalid"; detail: string }
  | { status: "ok"; map: LegacyHashMap };

type Hashes = LegacyHashMap;

function isHashList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isHashRecord(value: unknown): value is Record<string, string[]> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(isHashList);
}

function normalizeLegacyHashMap(value: unknown): LegacyHashMap | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Partial<LegacyHashMap>;
  if (record.agents !== undefined && !isHashRecord(record.agents)) return null;
  if (record.commands !== undefined && !isHashRecord(record.commands)) return null;
  if (record.skills !== undefined && !isHashRecord(record.skills)) return null;
  const normalized: LegacyHashMap = { agents: record.agents ?? {}, commands: record.commands ?? {} };
  if (record.skills !== undefined) normalized.skills = record.skills;
  return normalized;
}

/** Read `kit/legacy-hashes.json` without treating a broken file as an empty prior. */
export function readLegacyHashFile(filePath: string): LegacyHashFileSnapshot {
  if (!existsSync(filePath)) return { status: "missing" };
  const raw = tryCatch(() => readFileSync(filePath, "utf8"));
  if (!raw.ok) return { status: "invalid", detail: raw.error.message };
  const parsed = tryCatch(() => JSON.parse(raw.value));
  if (!parsed.ok) return { status: "invalid", detail: "invalid JSON" };
  const map = normalizeLegacyHashMap(parsed.value);
  if (!map) return { status: "invalid", detail: "expected an object with agents/commands" };
  return { status: "ok", map };
}

const cache = new Map<string, Hashes>();

function load(kit: string = kitDir()): Hashes {
  const hit = cache.get(kit);
  if (hit) return hit;
  const snapshot = readLegacyHashFile(join(kit, "legacy-hashes.json"));
  const hashes = snapshot.status === "ok" ? snapshot.map : { agents: {}, commands: {} };
  cache.set(kit, hashes);
  return hashes;
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
  const kinds = ["agents", "commands", "skills"] as const;
  for (const kind of kinds) {
    const names = new Set([...Object.keys(prior[kind] ?? {}), ...Object.keys(next[kind] ?? {})]);
    if (names.size === 0) continue;
    merged[kind] = {};
    for (const name of names) {
      merged[kind]![name] = unionSorted(prior[kind]?.[name] ?? [], next[kind]?.[name] ?? []);
    }
  }
  return merged;
}

/** Fails when regeneration would drop a recorded hash (silent deletion). */
export function legacyHashMergeIssues(prior: LegacyHashMap, merged: LegacyHashMap): string[] {
  const issues: string[] = [];
  for (const kind of ["agents", "commands", "skills"] as const) {
    for (const [name, hashes] of Object.entries(prior[kind] ?? {})) {
      const kept = merged[kind]?.[name];
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

export function isKitCopy(
  kind: "agents" | "commands",
  name: string,
  text: string,
  source: string | undefined,
  kit: string = kitDir(),
): boolean {
  const normalized = text.replace(/\r\n/g, "\n");
  if (source !== undefined && normalized === source.replace(/\r\n/g, "\n")) return true;
  const known = load(kit)[kind][name];
  return known !== undefined && known.includes(shortHash(normalized));
}

/**
 * True when a skill file's bytes match a version `init` shipped (by hash).
 * Keys are `<skill>/<posix-rel-path>`; the caller compares current-kit bytes
 * separately, so no `source` parameter: anything not recorded is user work.
 */
export function isKitSkillCopy(skillFileKey: string, text: string, kit: string = kitDir()): boolean {
  const known = load(kit).skills?.[skillFileKey];
  return known !== undefined && known.includes(shortHash(text.replace(/\r\n/g, "\n")));
}
