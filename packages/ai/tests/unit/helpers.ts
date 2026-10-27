import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach } from "vitest";
import { kitDir, readManifest } from "#kit.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "zedkit-ai-"));
  dirs.push(dir);
  return dir;
}

export function put(root: string, rel: string, content: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export const SKILL = (name: string): string =>
  `---\nname: ${name}\ndescription: "Does ${name}. Use when needed."\n---\n\n# ${name}\n`;

export const AGENT = (name: string, extra = ""): string =>
  `---\nname: ${name}\ndescription: "Agent ${name}. Use when needed."\n${extra}---\n\nBody.\n`;

export const COMMAND = (skill: string, description = "Runs a skill."): string =>
  `---\ndescription: ${description}\n---\n\nRun the \`${skill}\` skill on \`$ARGUMENTS\`.\n`;

/** Every installable name: agents + commands + skill dirs (+ presets when asked). */
export function shippedNames(includePresets = false): Set<string> {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  const extra = includePresets ? Object.keys(manifest.value.presets) : [];
  return new Set(
    manifest.value.agents.concat(manifest.value.commands ?? [], readdirSync(join(kitDir(), "skills")), extra),
  );
}
