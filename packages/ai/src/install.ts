// Original work by the same author.
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, sep } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedkit/core";
import { parseFrontmatter } from "./frontmatter.js";
import { kitDir, readManifest, type KitManifest } from "./kit.js";

export type Target = "claude" | "cursor";

export type InstallOptions = {
  /** Project directory to install into. */
  dest: string;
  /** Preset name from kit.json. Default `core`. */
  preset?: string;
  /** Tool adapters to wire. Default: all. */
  targets?: Target[];
  /** Report what would happen without touching the disk. */
  dryRun?: boolean;
  /** Custom kit directory (default: the bundled kit). */
  kit?: string;
};

export type Action = {
  kind: "copy" | "link" | "write" | "skip";
  path: string;
  /** Why it was skipped, or what a link points to. */
  note?: string;
};

const ALL_TARGETS: Target[] = ["claude", "cursor"];

const CURSOR_RULE = `---
description: Project rules
alwaysApply: true
---

Read and follow /AGENTS.md at the repo root, and use the skills in .agents/skills.
`;

type Ctx = { dest: string; kit: string; dryRun: boolean; actions: Action[] };

function lstatOf(path: string): ReturnType<typeof lstatSync> | undefined {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok ? stat.value : undefined;
}

function isDirectory(path: string): boolean {
  const stat = tryCatch(() => statSync(path));
  return stat.ok && stat.value.isDirectory();
}

// Why `rel` cannot be created, or undefined when the way is free. The path
// itself is taken if anything (even a dangling symlink) is there; a parent
// that is not a directory would make the write fail halfway.
function obstacle(ctx: Ctx, rel: string): string | undefined {
  const parts = rel.split(sep);
  for (let i = 1; i < parts.length; i++) {
    const parent = join(ctx.dest, ...parts.slice(0, i));
    if (lstatOf(parent) && !isDirectory(parent)) {
      return `${parts.slice(0, i).join(sep)} is not a directory`;
    }
  }
  return lstatOf(join(ctx.dest, rel)) ? "already exists, left untouched" : undefined;
}

function place(ctx: Ctx, kind: Exclude<Action["kind"], "skip">, rel: string, make: () => void, note?: string): void {
  const blocked = obstacle(ctx, rel);
  if (blocked) {
    const current = tryCatch(() => readlinkSync(join(ctx.dest, rel)));
    const same = kind === "link" && current.ok && current.value === note;
    ctx.actions.push({ kind: "skip", path: rel, note: same ? "already linked" : blocked });
    return;
  }
  ctx.actions.push({ kind, path: rel, ...(note !== undefined && { note }) });
  if (ctx.dryRun) return;
  mkdirSync(dirname(join(ctx.dest, rel)), { recursive: true });
  make();
}

function copyFile(ctx: Ctx, from: string, rel: string): void {
  place(ctx, "copy", rel, () => copyFileSync(from, join(ctx.dest, rel)));
}

function link(ctx: Ctx, rel: string, target: string): void {
  place(ctx, "link", rel, () => symlinkSync(target, join(ctx.dest, rel)), target);
}

function skillNames(manifest: KitManifest, kit: string, preset: string): string[] {
  const entry = Object.hasOwn(manifest.presets, preset) ? manifest.presets[preset] : undefined;
  if (entry === undefined) {
    throw new Error(`unknown preset "${preset}" (have: ${Object.keys(manifest.presets).join(", ")})`);
  }
  if (entry !== "*") return entry;
  return readdirSync(join(kit, "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// Resolve everything the install needs from the kit before the first write,
// so a bad preset or manifest never leaves a half install behind.
function plan(kit: string, manifest: KitManifest, preset: string) {
  const skills = skillNames(manifest, kit, preset);
  for (const name of skills) {
    if (!existsSync(join(kit, "skills", name, "SKILL.md"))) throw new Error(`kit has no skill "${name}"`);
  }
  for (const name of manifest.agents) {
    if (!existsSync(join(kit, "agents", `${name}.md`))) throw new Error(`kit has no agent "${name}"`);
  }
  const commands = manifest.commands ?? [];
  for (const name of commands) {
    if (!existsSync(join(kit, "commands", `${name}.md`))) throw new Error(`kit has no command "${name}"`);
  }
  const licences = readdirSync(join(kit, "skills")).filter((f) => f.startsWith("LICENSE-"));
  return { skills, licences, agents: manifest.agents, commands };
}

function installContent(ctx: Ctx, content: ReturnType<typeof plan>): void {
  for (const name of content.skills) {
    const rel = join(".agents", "skills", name);
    // dereference: a symlink inside a skill must not be copied as a dangling one
    place(ctx, "copy", rel, () =>
      cpSync(join(ctx.kit, "skills", name), join(ctx.dest, rel), { recursive: true, dereference: true }),
    );
  }
  // Licence texts of vendored skills travel with them.
  for (const file of content.licences) {
    copyFile(ctx, join(ctx.kit, "skills", file), join(".agents", "skills", file));
  }
  copyFile(ctx, join(ctx.kit, "THIRD_PARTY_NOTICES.md"), join(".agents", "THIRD_PARTY_NOTICES.md"));
  for (const name of content.agents) {
    copyFile(ctx, join(ctx.kit, "agents", `${name}.md`), join(".agents", "agents", `${name}.md`));
  }
  for (const name of content.commands) {
    copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(".agents", "commands", `${name}.md`));
  }
  copyFile(ctx, join(ctx.kit, "AGENTS.template.md"), "AGENTS.md");
}

function agentsMdReady(ctx: Ctx): boolean {
  if (ctx.actions.some((a) => a.kind === "copy" && a.path === "AGENTS.md")) return true;
  const stat = tryCatch(() => statSync(join(ctx.dest, "AGENTS.md")));
  return stat.ok && stat.value.isFile();
}

// Name of another rule in .cursor/rules/ that is already always on, if any.
// A second always-on rule would only duplicate (or fight) it, so the
// installer skips project.mdc then. Reads the disk only, so dry runs agree.
function existingAlwaysOnRule(ctx: Ctx): string | undefined {
  const dir = join(ctx.dest, ".cursor", "rules");
  const entries = tryCatch(() => readdirSync(dir, { withFileTypes: true }));
  if (!entries.ok) return undefined;
  for (const entry of entries.value) {
    if (!entry.isFile() || !entry.name.endsWith(".mdc") || entry.name === "project.mdc") continue;
    const read = tryCatch(() => readFileSync(join(dir, entry.name), "utf8"));
    if (!read.ok) continue;
    const front = parseFrontmatter(read.value);
    if (front.ok && front.value.data.alwaysApply === true) return entry.name;
  }
  return undefined;
}

function writeCursorRule(ctx: Ctx): void {
  const rel = join(".cursor", "rules", "project.mdc");
  if (obstacle(ctx, rel) === undefined) {
    const existing = existingAlwaysOnRule(ctx);
    if (existing !== undefined) {
      ctx.actions.push({ kind: "skip", path: rel, note: `always-on rule ${existing} already exists` });
      return;
    }
  }
  place(ctx, "write", rel, () => writeFileSync(join(ctx.dest, rel), CURSOR_RULE));
}

function wireTarget(ctx: Ctx, target: Target): void {
  const dir = target === "claude" ? ".claude" : ".cursor";
  link(ctx, join(dir, "skills"), "../.agents/skills");
  link(ctx, join(dir, "agents"), "../.agents/agents");
  link(ctx, join(dir, "commands"), "../.agents/commands");
  if (target === "claude") {
    // Only when AGENTS.md is (or will be) a real file: never a dangling link.
    if (agentsMdReady(ctx)) link(ctx, "CLAUDE.md", "AGENTS.md");
    else ctx.actions.push({ kind: "skip", path: "CLAUDE.md", note: "AGENTS.md is not a file" });
  } else {
    writeCursorRule(ctx);
  }
}

/**
 * Install the kit into a project. Skills and subagents are copied (the
 * project owns them from then on); tool folders are symlinks to `.agents/`.
 * Existing files are never overwritten: they are reported as skipped. A bad
 * preset or kit fails before anything is written.
 */
export function installKit(options: InstallOptions): Result<Action[]> {
  const kit = options.kit ?? kitDir();
  const manifest = readManifest(kit);
  if (!manifest.ok) return err(manifest.error);
  const ctx: Ctx = { dest: options.dest, kit, dryRun: options.dryRun ?? false, actions: [] };
  const run = tryCatch(() => {
    const content = plan(kit, manifest.value, options.preset ?? "core");
    installContent(ctx, content);
    for (const target of options.targets ?? ALL_TARGETS) wireTarget(ctx, target);
  });
  return run.ok ? ok(ctx.actions) : err(run.error);
}
