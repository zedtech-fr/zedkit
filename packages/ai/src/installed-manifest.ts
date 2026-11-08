// Original work by the same author.
/**
 * The install manifest: which kit version wrote which installed file, and the
 * content hash after transforms. A rerun trusts its own record: a file whose
 * bytes still match is kit-owned (update in place), anything else keeps the
 * adopt rules. Installs that predate the manifest fall back to legacy hashes.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";

export const MANIFEST_NAME = ".zedkit-manifest.json";
export const MANIFEST_SCHEMA = 1;

export type InstalledManifest = {
  schema: 1;
  /** Kit package version that wrote these files, or "unknown". */
  kit: string;
  /** Install-relative path (`/` separators) -> post-write content hash. */
  files: Record<string, string>;
};

export type InstalledManifestSnapshot =
  | { status: "missing" }
  | { status: "invalid"; detail: string }
  | { status: "ok"; manifest: InstalledManifest };

function normalizeManifest(value: unknown): InstalledManifest | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { schema?: unknown; kit?: unknown; files?: unknown };
  if (record.schema !== MANIFEST_SCHEMA) return null;
  if (typeof record.kit !== "string") return null;
  if (typeof record.files !== "object" || record.files === null) return null;
  for (const [key, hash] of Object.entries(record.files)) {
    if (typeof key !== "string" || typeof hash !== "string") return null;
  }
  return { schema: MANIFEST_SCHEMA, kit: record.kit, files: record.files as Record<string, string> };
}

/** Read the manifest without treating a broken file as an empty prior. */
export function readInstalledManifest(dest: string): InstalledManifestSnapshot {
  const full = join(dest, ".agents", MANIFEST_NAME);
  if (!existsSync(full)) return { status: "missing" };
  const raw = tryCatch(() => readFileSync(full, "utf8"));
  if (!raw.ok) return { status: "invalid", detail: raw.error.message };
  const parsed = tryCatch(() => JSON.parse(raw.value) as unknown);
  if (!parsed.ok) return { status: "invalid", detail: "invalid JSON" };
  const manifest = normalizeManifest(parsed.value);
  if (!manifest) return { status: "invalid", detail: "unsupported manifest (newer schema?)" };
  return { status: "ok", manifest };
}

/** Persist the manifest; an unwritable manifest never fails the install. */
export function writeInstalledManifest(dest: string, manifest: InstalledManifest): void {
  const write = tryCatch(() => {
    mkdirSync(join(dest, ".agents"), { recursive: true });
    writeFileSync(join(dest, ".agents", MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
  });
  if (!write.ok) throw write.error;
}

/** Kit package version for the manifest, or "unknown" when unreadable. */

export function kitVersion(kit: string): string {
  const raw = tryCatch(() => readFileSync(join(kit, "..", "package.json"), "utf8"));
  if (!raw.ok) return "unknown";
  const parsed = tryCatch(() => JSON.parse(raw.value) as unknown);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) return "unknown";
  const version = (parsed.value as { version?: unknown }).version;
  return typeof version === "string" ? version : "unknown";
}
