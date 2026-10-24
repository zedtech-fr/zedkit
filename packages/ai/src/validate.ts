// Original work by the same author.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { tryCatch } from "@zedkit/core";
import { readManifest } from "./kit.js";
import { parseFrontmatter } from "./frontmatter.js";

export type Issue = { path: string; message: string };

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function dirsIn(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory());
}

function checkName(name: unknown, expected: string, path: string, issues: Issue[]): void {
  if (name !== expected) {
    issues.push({ path, message: `name must equal "${expected}" (got ${JSON.stringify(name)})` });
  }
  if (!NAME.test(expected) || expected.length > MAX_NAME) {
    issues.push({ path, message: `name must be lowercase-hyphen, at most ${MAX_NAME} characters` });
  }
}

// True when `description:` is a plain or quoted scalar that fits on one line.
// A block scalar (`>`, `|`) can be shown literally in an agent list, and a
// continuation line is just as invisible to simple parsers.
function isSingleLineDescription(raw: string): boolean {
  const lines = raw.split("\n");
  const at = lines.findIndex((line) => /^description:/.test(line));
  if (at < 0) return true;
  const value = (lines[at] ?? "").slice("description:".length).trim();
  const next = lines[at + 1];
  return value !== "" && !/^[>|]/.test(value) && !(next !== undefined && /^[ \t]+\S/.test(next));
}

function checkDescription(value: unknown, path: string, issues: Issue[]): void {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({ path, message: "description is required and must be a non-empty string" });
  } else if (value.length > MAX_DESCRIPTION) {
    issues.push({ path, message: `description is ${value.length} characters (max ${MAX_DESCRIPTION})` });
  }
}

function checkSkill(root: string, name: string, issues: Issue[]): void {
  const file = join(root, "skills", name, "SKILL.md");
  const path = relative(root, file);
  if (!existsSync(file)) {
    issues.push({ path: relative(root, join(root, "skills", name)), message: "skill folder has no SKILL.md" });
    return;
  }
  const parsed = parseFrontmatter(read(file));
  if (!parsed.ok) {
    issues.push({ path, message: parsed.error.message });
    return;
  }
  checkName(parsed.value.data.name, name, path, issues);
  checkDescription(parsed.value.data.description, path, issues);
}

function checkAgent(root: string, file: string, issues: Issue[]): void {
  const path = join("agents", file);
  const parsed = parseFrontmatter(read(join(root, path)));
  if (!parsed.ok) {
    issues.push({ path, message: parsed.error.message });
    return;
  }
  const { data, raw } = parsed.value;
  checkName(data.name, file.replace(/\.md$/, ""), path, issues);
  checkDescription(data.description, path, issues);
  if (!isSingleLineDescription(raw)) {
    issues.push({ path, message: "description must be a single line (no `>` or `|` block, no continuation lines)" });
  }
  // An id the tool does not know falls back silently, and the kit is
  // tool-agnostic: only `inherit` is portable.
  if (data.model !== undefined && data.model !== "inherit") {
    issues.push({ path, message: 'model must be omitted or "inherit" (pin a model in your project, after listing what your tool accepts)' });
  }
}

function checkLineEndings(root: string, issues: Issue[]): void {
  const entries = readdirSync(root, { recursive: true, encoding: "utf8" });
  for (const entry of entries) {
    const full = join(root, entry);
    if (entry.endsWith(".md") && statSync(full).isFile() && read(full).includes("\r")) {
      issues.push({ path: entry, message: "CR found: use LF line endings" });
    }
  }
}

function checkManifest(root: string, issues: Issue[]): void {
  if (!existsSync(join(root, "kit.json"))) return;
  const manifest = readManifest(root);
  if (!manifest.ok) {
    issues.push({ path: "kit.json", message: manifest.error.message });
    return;
  }
  const skills = new Set(dirsIn(join(root, "skills")));
  const agents = new Set(
    existsSync(join(root, "agents"))
      ? readdirSync(join(root, "agents")).map((f) => f.replace(/\.md$/, ""))
      : [],
  );
  for (const [preset, names] of Object.entries(manifest.value.presets)) {
    for (const name of names === "*" ? [] : names) {
      if (!skills.has(name)) issues.push({ path: "kit.json", message: `preset "${preset}" lists missing skill "${name}"` });
    }
  }
  for (const name of manifest.value.agents) {
    if (!agents.has(name)) issues.push({ path: "kit.json", message: `lists missing agent "${name}"` });
  }
}

function collect(root: string): Issue[] {
  const issues: Issue[] = [];
  for (const name of dirsIn(join(root, "skills"))) checkSkill(root, name, issues);
  const agentsDir = join(root, "agents");
  if (existsSync(agentsDir)) {
    for (const file of readdirSync(agentsDir).filter((f) => f.endsWith(".md"))) {
      checkAgent(root, file, issues);
    }
  }
  checkManifest(root, issues);
  checkLineEndings(root, issues);
  return issues;
}

/**
 * Check a directory laid out as `skills/<name>/SKILL.md`, `agents/<name>.md`
 * and optionally `kit.json`. Returns every problem found; empty means valid.
 * An unreadable entry (dangling symlink, permissions) is reported as a
 * problem instead of throwing.
 */
export function validateKit(root: string): Issue[] {
  if (!existsSync(root)) {
    return [{ path: root, message: "directory does not exist" }];
  }
  const result = tryCatch(() => collect(root));
  return result.ok ? result.value : [{ path: root, message: `cannot read: ${result.error.message}` }];
}
