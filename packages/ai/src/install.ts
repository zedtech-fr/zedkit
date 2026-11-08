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
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, sep } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { parseFrontmatter } from "./frontmatter.js";
import { hasMarker } from "./generate.js";
import {
  kitVersion,
  readInstalledManifest,
  writeInstalledManifest,
  type InstalledManifestSnapshot,
} from "./installed-manifest.js";
import { adoptRel, agentsForPreset, commandsForPreset, kitDir, kitUniverse, readManifest, type KitManifest } from "./kit.js";
import { isKitCopy, isKitSkillCopy, shortHash } from "./legacy.js";
import { setLensStatus } from "./lenses.js";
import { danglingKitRefs, skillRefFiles } from "./skill-refs.js";
import { resolveConditionals, type Availability } from "./conditional.js";
import { loadPolicy } from "./route.js";
import { assertAgentRoutes, resolveAgentSource, syncAgents } from "./sync.js";
import { applyTestPolicyToAgentsMd, detectRunner } from "./test-policy.js";
import { loadDefaults } from "./tokenomics.js";

/** Providers that get an installer layer or shared-source wiring. */
export type Provider = "claude" | "cursor" | "codex";

/** @deprecated Use {@link Provider}. Kept so `--target` and old callers keep working. */
export type Target = Provider;

/** Shared-source runtime id (not part of the public {@link Provider} union). */
type SharedSourceProvider = "muse";

type WireProvider = Provider | SharedSourceProvider;

export type InstallOptions = {
  /** Project directory to install into. */
  dest: string;
  /** Preset name from kit.json. Default `starter`. */
  preset?: string;
  /** Providers to wire. Default: all supported runtimes. Extra runtime ids are accepted at runtime. */
  providers?: readonly (Provider | string)[];
  /** @deprecated Use `providers`. */
  targets?: readonly (Provider | string)[];
  /** Report what would happen without touching the disk. */
  dryRun?: boolean;
  /**
   * On a name collision keep the user file and write the kit version next to
   * it (`review.kit.md` for files, `zk-review` for skill folders).
   */
  adopt?: boolean;
  /** Custom kit directory (default: the bundled kit). */
  kit?: string;
  /**
   * Write a fast model id from the project's tokenomics. Only when the user
   * explicitly requested fast mode in this request.
   */
  allowFast?: boolean;
};

export type Action = {
  /** `generate`, `convert` and `prune` come from `syncKit`; the rest from `installKit`. */
  kind: "copy" | "link" | "write" | "append" | "skip" | "generate" | "convert" | "prune";
  path: string;
  /** Why it was skipped, what was appended, or what a link points to. */
  note?: string;
};

/** Every runtime the installer can wire; the CLI accepts these plus `all`. */
export const ALL_PROVIDERS: readonly WireProvider[] = ["claude", "cursor", "codex", "muse"];

const CURSOR_RULE = `---
description: Project rules
alwaysApply: true
---

Read and follow /AGENTS.md at the repo root, and use the skills in .agents/skills.
Multi-step or multi-lens work goes through the orchestrate skill; atomic fixes stay inline with their check.
`;

type Ctx = {
  dest: string;
  kit: string;
  dryRun: boolean;
  adopt: boolean;
  actions: Action[];
  /** What this preset installs; resolves conditional kit blocks. Set after plan(). */
  avail: Availability;
  allowFast: boolean;
  /** This install's own record (missing for pre-manifest installs). Read-only input. */
  priorManifest: InstalledManifestSnapshot;
  /** Install-relative (`/` separators) -> post-write content hash, saved at the end. */
  written: Map<string, string>;
};

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

// Provider layer dirs are link targets, never sidecarred: a `.claude/zk-skills`
// link is dead (no provider reads it), so a blocked layer dir is just
// skipped. Sidecars exist only for files (`*.kit.md`) and skill folders
// (`zk-<name>`), including a same-named project skill dir inside a layer:
// linkPresentSkills copies the kit skill beside it under `zk-<name>` instead
// of linking through the block.
const LAYER_DIRS: ReadonlySet<string> = new Set(
  ["skills", "agents", "commands"].map((kind) => join(".claude", kind)).concat(join(".cursor", "skills")),
);

function canAdopt(rel: string): boolean {
  if (LAYER_DIRS.has(rel)) return false;
  const [root, kind] = rel.split(sep);
  if (root === ".agents" && (kind === "skills" || kind === "agents" || kind === "commands" || kind === "personas.md")) {
    return true;
  }
  if ((root === ".cursor" || root === ".claude") && (kind === "skills" || kind === "agents" || kind === "commands")) {
    return true;
  }
  return false;
}

function treeFiles(root: string): string[] | undefined {
  const entries = tryCatch(() => readdirSync(root, { recursive: true, encoding: "utf8" }));
  if (!entries.ok) return undefined;
  return entries.value.filter((e) => {
    const st = tryCatch(() => statSync(join(root, e)));
    return st.ok && st.value.isFile();
  }).sort();
}

// Conditional markers resolved; plain files pass through untouched.
function resolveIfNeeded(text: string, avail: Availability): string {
  return text.includes("<!-- if:") ? resolveConditionals(text, avail) : text;
}

function treesMatch(src: string, dest: string, installed: ReadonlySet<string>, avail: Availability): boolean {
  const from = treeFiles(src);
  const to = treeFiles(dest);
  if (!from || !to || from.join("\n") !== to.join("\n")) return false;
  return from.every((rel) => {
    const raw = tryCatch(() => readFileSync(join(src, rel), "utf8"));
    const got = tryCatch(() => readFileSync(join(dest, rel), "utf8"));
    if (!raw.ok || !got.ok) return false;
    const lensed = rel === "lenses.md" ? setLensStatus(raw.value, installed) : raw.value;
    return resolveIfNeeded(lensed, avail) === got.value;
  });
}

// Install-relative manifest key with stable separators.
function manifestKey(rel: string): string {
  return rel.split(sep).join("/");
}

// Hash of bytes on disk, or undefined when unreadable.
function diskHash(full: string): string | undefined {
  const raw = tryCatch(() => readFileSync(full, "utf8"));
  return raw.ok ? shortHash(raw.value) : undefined;
}

// Record post-write bytes so the next run recognizes its own record.
function recordWritten(ctx: Ctx, rel: string): void {
  if (ctx.dryRun) return;
  const hash = diskHash(join(ctx.dest, rel));
  if (hash !== undefined) ctx.written.set(manifestKey(rel), hash);
}

// Record every file under an installed skill dir after copy + patch.
function recordSkillDir(ctx: Ctx, rel: string): void {
  if (ctx.dryRun) return;
  const files = treeFiles(join(ctx.dest, rel));
  if (!files) return;
  for (const file of files) recordWritten(ctx, join(rel, ...file.split("/")));
}

// True when every file under an installed skill dir is this install's own
// record: untouched since we wrote it, safe to update in place.
function manifestOwnsSkillDir(ctx: Ctx, rel: string): boolean {
  if (ctx.priorManifest.status !== "ok") return false;
  const files = treeFiles(join(ctx.dest, rel));
  if (!files) return false;
  return files.every((file) => {
    const hash = diskHash(join(ctx.dest, rel, ...file.split("/")));
    return hash !== undefined && ctx.priorManifest.status === "ok" && ctx.priorManifest.manifest.files[manifestKey(join(rel, file))] === hash;
  });
}

// True when every file under an installed skill dir is a copy of the kit:
// either the current kit (post-transform, same comparison as treesMatch) or
// a recorded older version. Missing files are fine (older kits had fewer);
// unknown bytes mean user work.
function legacyOwnsSkillDir(ctx: Ctx, name: string, destDir: string): boolean {
  const files = treeFiles(destDir);
  if (!files) return false;
  const installed = new Set([...ctx.avail.skills, ...ctx.avail.agents]);
  for (const file of files) {
    const raw = tryCatch(() => readFileSync(join(destDir, ...file.split("/")), "utf8"));
    if (!raw.ok) return false;
    const kitRaw = tryCatch(() => readFileSync(join(ctx.kit, "skills", name, ...file.split("/")), "utf8"));
    if (kitRaw.ok) {
      const lensed = file === "lenses.md" ? setLensStatus(kitRaw.value, installed) : kitRaw.value;
      if (resolveIfNeeded(lensed, ctx.avail) === raw.value) continue;
    }
    if (isKitSkillCopy(`${name}/${file}`, raw.value)) continue;
    return false;
  }
  return true;
}

// Frontmatter skill name a project directory claims, if it is a skill at all.
function houseSkillName(dir: string): string | undefined {
  const raw = tryCatch(() => readFileSync(join(dir, "SKILL.md"), "utf8"));
  if (!raw.ok) return undefined;
  const front = parseFrontmatter(raw.value);
  if (!front.ok || typeof front.value.data.name !== "string") return undefined;
  return front.value.data.name;
}

// True when a provider-layer sidecar already carries this kit skill under its
// renamed identity: SKILL.md matches the renamed copy, other files match the
// installed kit bytes (lenses patched, conditionals resolved).
function layerSidecarUpToDate(ctx: Ctx, kitName: string, sidecarRel: string, zkName: string, installed: ReadonlySet<string>): boolean {
  const from = treeFiles(join(ctx.kit, "skills", kitName));
  const to = treeFiles(join(ctx.dest, sidecarRel));
  if (!from || !to || from.join("\n") !== to.join("\n")) return false;
  return from.every((file) => {
    const raw = tryCatch(() => readFileSync(join(ctx.kit, "skills", kitName, ...file.split("/")), "utf8"));
    const got = tryCatch(() => readFileSync(join(ctx.dest, sidecarRel, ...file.split("/")), "utf8"));
    if (!raw.ok || !got.ok) return false;
    const lensed = file === "lenses.md" ? setLensStatus(raw.value, installed) : raw.value;
    const patched = resolveIfNeeded(lensed, ctx.avail);
    if (file === "SKILL.md") {
      // Rename lands after patching, same as copyLayerSkillSidecar.
      return (withSidecarSkillName(patched, zkName) ?? patched) === got.value;
    }
    return patched === got.value;
  });
}

// Resolved directory, or undefined when it does not exist (nothing to delete).
function realDir(path: string): string | undefined {
  const resolved = tryCatch(() => realpathSync(path));
  return resolved.ok ? resolved.value : undefined;
}

// Why a skill dir must not be replaced, or undefined when replacement is
// safe. A layer that symlinks into the kit makes destination and source the
// same folder: deleting it would delete the kit's own sources (this repo's
// `.agents/skills` links there). A destination inside the kit tree is an
// install pointed at the kit repo itself, never a consumer project. A path
// that does not exist yet resolves through its parent, so creating a sidecar
// beside a symlinked dir cannot smuggle files into the kit either.
function refreshBlocked(ctx: Ctx, rel: string, srcDir: string): string | undefined {
  const full = join(ctx.dest, rel);
  const realDest = realDir(full) ?? realDir(dirname(full));
  const realSrc = realDir(srcDir);
  if (realDest !== undefined && realSrc !== undefined && realDest === realSrc) {
    return "same directory as the kit source (symlinked install), left untouched";
  }
  const realKit = realDir(ctx.kit);
  if (realDest !== undefined && realKit !== undefined && (realDest === realKit || realDest.startsWith(`${realKit}${sep}`))) {
    return "inside the kit source tree, left untouched";
  }
  return undefined;
}

// True when an existing provider sidecar is a kit copy, safe to replace: it
// matches the current kit bytes, this install's record, or a recorded older
// version (SKILL.md compared with the sidecar name mapped back to the kit
// name). Anything else is user work and must be preserved.
function layerSidecarKitOwned(ctx: Ctx, kitName: string, sidecarRel: string, installed: ReadonlySet<string>): boolean {
  if (layerSidecarUpToDate(ctx, kitName, sidecarRel, `zk-${kitName}`, installed)) return true;
  if (manifestOwnsSkillDir(ctx, sidecarRel)) return true;
  const files = treeFiles(join(ctx.dest, sidecarRel));
  if (!files) return false;
  return files.every((file) => {
    const raw = tryCatch(() => readFileSync(join(ctx.dest, sidecarRel, ...file.split("/")), "utf8"));
    if (!raw.ok) return false;
    const text = file === "SKILL.md" ? (withSidecarSkillName(raw.value, kitName) ?? raw.value) : raw.value;
    return isKitSkillCopy(`${kitName}/${file}`, text);
  });
}

// Why the provider sidecar must not be (re)written, or undefined when the
// copy may proceed. The callers check before logging the action, so a skip
// never follows a copy for the same path.
function sidecarBlocker(ctx: Ctx, kitName: string, sidecarRel: string, installed: ReadonlySet<string>): string | undefined {
  const srcDir = join(ctx.kit, "skills", kitName);
  if (!existsSync(join(srcDir, "SKILL.md"))) {
    return `kit has no skill "${kitName}" (project skill kept, no sidecar written)`;
  }
  const blocked = refreshBlocked(ctx, sidecarRel, srcDir);
  if (blocked !== undefined) return blocked;
  const existing = lstatOf(join(ctx.dest, sidecarRel));
  if (existing?.isDirectory() === true && !existing.isSymbolicLink() && !layerSidecarKitOwned(ctx, kitName, sidecarRel, installed)) {
    return "kept (user-modified sidecar is not a kit copy; diff and merge by hand)";
  }
  return undefined;
}

// Copy the kit skill into the provider layer under its renamed identity.
// Never writes through the layer link: the canonical source stays shared.
function copyLayerSkillSidecar(ctx: Ctx, kitName: string, sidecarRel: string, installed: ReadonlySet<string>): void {
  if (ctx.dryRun) return;
  rmSync(join(ctx.dest, sidecarRel), { recursive: true, force: true });
  cpSync(join(ctx.kit, "skills", kitName), join(ctx.dest, sidecarRel), { recursive: true, dereference: true });
  patchLenses(join(ctx.dest, sidecarRel), installed);
  patchConditionals(join(ctx.dest, sidecarRel), ctx.avail);
  renameFreshSidecarSkill(join(ctx.dest, sidecarRel), kitName);
  recordSkillDir(ctx, sidecarRel);
}

// Adopt sidecars must not claim the live skill name: two SKILL.md files with
// one `name:` read as two live skills sharing it. Only that line is
// rewritten (line endings normalize to LF, the validated form), so the
// sidecar stays a faithful kit copy for diffing. Undefined when the file has
// no frontmatter `name:` line to rewrite, or the rewrite does not re-parse
// to the sidecar name (a folded `name:` stays untouched for a human).
function withSidecarSkillName(text: string, sidecarName: string): string | undefined {
  const lines = text.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").split("\n");
  if (lines[0] !== "---") return undefined;
  const close = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---");
  if (close < 0) return undefined;
  const at = lines.findIndex((line, index) => index > 0 && index < close && /^name:[ \t]*\S/.test(line));
  if (at < 0) return undefined;
  lines[at] = `name: ${sidecarName}`;
  const next = lines.join("\n");
  const check = parseFrontmatter(next);
  return check.ok && check.value.data.name === sidecarName ? next : undefined;
}

function renameFreshSidecarSkill(skillDir: string, base: string): void {
  const file = join(skillDir, "SKILL.md");
  const raw = tryCatch(() => readFileSync(file, "utf8"));
  if (!raw.ok) return;
  const renamed = withSidecarSkillName(raw.value, `zk-${base}`);
  if (renamed !== undefined) writeFileSync(file, renamed);
}

// A pre-fix adopt run left sidecars claiming the base skill name. A re-run
// rewrites just that line; every other byte (including user margin notes in
// the sidecar) stays untouched, and the user file is never rewritten.
function migrateSidecarSkillName(ctx: Ctx, rel: string, base: string): void {
  const sidecar = adoptRel(rel);
  const file = join(ctx.dest, sidecar, "SKILL.md");
  const raw = tryCatch(() => readFileSync(file, "utf8"));
  if (!raw.ok) return;
  const front = parseFrontmatter(raw.value);
  if (!front.ok || front.value.data.name !== base) return;
  const renamed = withSidecarSkillName(raw.value, `zk-${base}`);
  if (renamed === undefined) return;
  ctx.actions.push({
    kind: "write",
    path: join(sidecar, "SKILL.md"),
    note: `sidecar skill renamed to zk-${base} so /${base} resolves to one skill`,
  });
  if (ctx.dryRun) return;
  writeFileSync(file, renamed);
}

function place(
  ctx: Ctx,
  kind: Exclude<Action["kind"], "skip">,
  rel: string,
  make: (destRel: string) => void,
  note?: string,
): string | undefined {
  const blocked = obstacle(ctx, rel);
  let target = rel;
  let targetNote = note;
  if (blocked) {
    const current = tryCatch(() => readlinkSync(join(ctx.dest, rel)));
    const sameLink = kind === "link" && current.ok && current.value === note;
    if (sameLink) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already linked" });
      return undefined;
    }
    if (ctx.adopt && canAdopt(rel)) {
      const alt = adoptRel(rel);
      const kitBlocked = refreshBlocked(ctx, alt, join(ctx.dest, rel));
      if (kitBlocked !== undefined) {
        ctx.actions.push({ kind: "skip", path: rel, note: kitBlocked });
        return undefined;
      }
      const altBlocked = obstacle(ctx, alt);
      ctx.actions.push({ kind: "skip", path: rel, note: `kept user file; kit → ${alt}` });
      if (altBlocked) {
        ctx.actions.push({ kind: "skip", path: alt, note: altBlocked });
        return undefined;
      }
      target = alt;
      targetNote = note !== undefined ? `${note}; user ${rel} kept` : `kit sidecar (user ${rel} kept)`;
    } else {
      ctx.actions.push({ kind: "skip", path: rel, note: blocked });
      return undefined;
    }
  }
  ctx.actions.push({ kind, path: target, ...(targetNote !== undefined && { note: targetNote }) });
  if (ctx.dryRun) return target;
  mkdirSync(dirname(join(ctx.dest, target)), { recursive: true });
  make(target);
  return target;
}

const PERSONAS_V2_COLUMNS = "| Persona | Goals |";

// Phase C rewrites .agents/personas.md in the v2 schema. Sidecarring the kit
// template next to a v2 file as personas.kit.md is noise, so it is kept with
// no sidecar. Anything without v2 headers (v1, hand-written) still gets the
// kit sidecar so the v2 schema stays visible.
function personasCustomized(current: string): boolean {
  return current.replace(/\s+/g, " ").includes(PERSONAS_V2_COLUMNS);
}

function legacyAgentOrCommand(rel: string): { kind: "agents" | "commands"; name: string } | undefined {
  const [root, kind, file] = rel.split(sep);
  if (root !== ".agents" || file === undefined || !file.endsWith(".md")) return undefined;
  if (kind !== "agents" && kind !== "commands") return undefined;
  return { kind, name: file.slice(0, -3) };
}

function copyFile(ctx: Ctx, from: string, rel: string): void {
  const kit = tryCatch(() => readFileSync(from, "utf8"));
  const text = kit.ok ? resolveIfNeeded(kit.value, ctx.avail) : undefined;
  if (text === undefined) {
    const target = place(ctx, "copy", rel, (destRel) => copyFileSync(from, join(ctx.dest, destRel)));
    if (target !== undefined) recordWritten(ctx, target);
    return;
  }
  if (ctx.adopt) {
    const current = tryCatch(() => readFileSync(join(ctx.dest, rel), "utf8"));
    if (current.ok && current.value === text) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      recordWritten(ctx, rel);
      return;
    }
    if (current.ok && rel === join(".agents", "personas.md") && personasCustomized(current.value)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "kept (already customized)" });
      return;
    }
    if (current.ok && canAdopt(rel)) {
      const prior = ctx.priorManifest.status === "ok" ? ctx.priorManifest.manifest.files[manifestKey(rel)] : undefined;
      const ownedByRecord = prior !== undefined && prior === shortHash(current.value);
      const legacyFile = legacyAgentOrCommand(rel);
      const ownedByLegacy = legacyFile !== undefined && isKitCopy(legacyFile.kind, legacyFile.name, current.value, text);
      // Generated files carry a marker and stay syncFile's job: rewriting the
      // kit text over them only churns (syncFile regenerates or skips itself).
      if ((ownedByRecord || ownedByLegacy) && hasMarker(current.value)) {
        ctx.actions.push({ kind: "skip", path: rel, note: "generated file up to date" });
        recordWritten(ctx, rel);
        return;
      }
      if (ownedByRecord || ownedByLegacy) {
        ctx.actions.push({
          kind: "copy",
          path: rel,
          note: ownedByRecord ? "updated (this install's record)" : "updated from earlier kit copy",
        });
        if (!ctx.dryRun) writeFileSync(join(ctx.dest, rel), text);
        recordWritten(ctx, rel);
        return;
      }
    }
  }
  const target = place(ctx, "copy", rel, (destRel) => writeFileSync(join(ctx.dest, destRel), text));
  if (target !== undefined) recordWritten(ctx, target);
}

function link(ctx: Ctx, rel: string, target: string): void {
  place(ctx, "link", rel, (destRel) => symlinkSync(target, join(ctx.dest, destRel)), target);
}

function skillNames(manifest: KitManifest, kit: string, preset: string): string[] {
  const entry = Object.hasOwn(manifest.presets, preset) ? manifest.presets[preset] : undefined;
  if (entry === undefined) {
    throw new Error(`unknown preset "${preset}" (have: ${Object.keys(manifest.presets).join(", ")})`);
  }
  if (entry !== "*") return entry;
  return [...kitUniverse(kit).skills];
}

// Resolve the kit plan and every agent route before the first write,
// so a bad preset, manifest, or fast cell never leaves a half install behind.
function plan(kit: string, manifest: KitManifest, preset: string) {
  const skills = skillNames(manifest, kit, preset);
  for (const name of skills) {
    if (!existsSync(join(kit, "skills", name, "SKILL.md"))) throw new Error(`kit has no skill "${name}"`);
  }
  const agents = agentsForPreset(manifest, preset);
  for (const name of agents) {
    if (!existsSync(join(kit, "agents", `${name}.md`))) throw new Error(`kit has no agent "${name}"`);
  }
  const commands = commandsForPreset(manifest, preset);
  for (const name of commands) {
    if (!existsSync(join(kit, "commands", `${name}.md`))) throw new Error(`kit has no command "${name}"`);
  }
  const licences = readdirSync(join(kit, "skills")).filter((f) => f.startsWith("LICENSE-"));
  const avail: Availability = { skills: new Set(skills), agents: new Set(agents), commands: new Set(commands) };
  const universe = kitUniverse(kit);
  const files = skillRefFiles(kit, skills, agents, commands).map((file) => ({
    ...file,
    text: resolveConditionals(file.text, avail, universe),
  }));
  const issues = danglingKitRefs(files, avail, universe);
  // Root docs resolve at copy time; check their resolved text now so a
  // preset whose template names an uninstalled skill fails before writing.
  // (The attribution notice names every vendored skill by design and is
  // exempt from closure, markers still validated.)
  const rootDocs: Array<[string, string]> = [[join(kit, "AGENTS.template.md"), "AGENTS.md"]];
  const personas = personasTemplate(kit, preset);
  if (personas !== undefined) rootDocs.unshift([personas, "personas.md"]);
  for (const [full, installedPath] of rootDocs) {
    if (!existsSync(full)) continue;
    const text = resolveConditionals(readFileSync(full, "utf8"), avail, universe);
    issues.push(...danglingKitRefs([{ path: installedPath, text, kitOrigin: true }], avail, universe));
  }
  if (issues.length > 0) {
    const detail = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`preset "${preset}" has dangling references: ${detail}`);
  }
  // Marker-bearing files outside skills/agents/commands resolve at copy
  // time; validate their markers now so a bad kit fails before writing.
  for (const name of licences) {
    resolveConditionals(readFileSync(join(kit, "skills", name), "utf8"), avail, universe);
  }
  for (const single of ["THIRD_PARTY_NOTICES.md"]) {
    if (existsSync(join(kit, single))) {
      resolveConditionals(readFileSync(join(kit, single), "utf8"), avail, universe);
    }
  }
  return { skills, licences, agents, commands, personas };
}

// setup ships the v2 schema so phase C edits `.agents/personas.md` in place
// instead of replacing the v1 Task/Bar table. Other presets keep v1.
function personasTemplate(kit: string, preset: string): string | undefined {
  if (preset === "setup") {
    const v2 = join(kit, "skills", "setup-ai", "templates", "personas-v2.template.md");
    if (existsSync(v2)) return v2;
  }
  const v1 = join(kit, "personas.template.md");
  return existsSync(v1) ? v1 : undefined;
}

// The ladder section every AGENTS.md must carry, lifted from the bundled
// template so the wording has a single home. Undefined when the kit has
// no template or no ladder section (foreign kits keep working).
function ladderSection(kit: string, avail: Availability): string | undefined {
  const template = tryCatch(() => readFileSync(join(kit, "AGENTS.template.md"), "utf8"));
  if (!template.ok) return undefined;
  const start = template.value.indexOf("## Before writing any code");
  if (start < 0) return undefined;
  const rest = template.value.slice(start);
  const next = rest.indexOf("\n## ", 1);
  const section = `${(next < 0 ? rest : rest.slice(0, next)).trimEnd()}\n`;
  return resolveIfNeeded(section, avail);
}

function readDestScripts(dest: string): Record<string, string> | undefined {
  const raw = tryCatch(() => JSON.parse(readFileSync(join(dest, "package.json"), "utf8")) as unknown);
  if (!raw.ok || raw.value === null || typeof raw.value !== "object") return undefined;
  const scripts = (raw.value as { scripts?: unknown }).scripts;
  if (scripts === null || typeof scripts !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command === "string") out[name] = command;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function fillAgentsCommands(ctx: Ctx): void {
  if (ctx.dryRun) return;
  const dest = join(ctx.dest, "AGENTS.md");
  const md = tryCatch(() => readFileSync(dest, "utf8"));
  if (!md.ok) return;
  const next = applyTestPolicyToAgentsMd(md.value, readDestScripts(ctx.dest), detectRunner(ctx.dest));
  if (next !== md.value) writeFileSync(dest, next);
}

// Fresh projects get the whole template; an existing AGENTS.md is never
// overwritten, but when it lacks the ladder the section is appended (and
// reported as `append`, so dry runs agree with real ones).
function installAgentsMd(ctx: Ctx): void {
  const blocked = obstacle(ctx, "AGENTS.md");
  if (blocked === undefined) {
    copyFile(ctx, join(ctx.kit, "AGENTS.template.md"), "AGENTS.md");
    fillAgentsCommands(ctx);
    return;
  }
  const current = tryCatch(() => readFileSync(join(ctx.dest, "AGENTS.md"), "utf8"));
  if (!current.ok || current.value.toLowerCase().includes("ladder")) {
    ctx.actions.push({ kind: "skip", path: "AGENTS.md", note: blocked });
    return;
  }
  const section = ladderSection(ctx.kit, ctx.avail);
  if (section === undefined) {
    ctx.actions.push({ kind: "skip", path: "AGENTS.md", note: blocked });
    return;
  }
  ctx.actions.push({ kind: "append", path: "AGENTS.md", note: "ladder section" });
  if (ctx.dryRun) return;
  const gap = current.value === "" ? "" : current.value.endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(join(ctx.dest, "AGENTS.md"), `${current.value}${gap}${section}`);
}

function patchLenses(folder: string, installed: ReadonlySet<string>): void {
  const file = join(folder, "lenses.md");
  if (!existsSync(file)) return;
  writeFileSync(file, setLensStatus(readFileSync(file, "utf8"), installed));
}

function patchConditionals(folder: string, avail: Availability): void {
  const files = tryCatch(() => readdirSync(folder, { recursive: true, encoding: "utf8" }));
  if (!files.ok) return;
  for (const rel of files.value) {
    if (!rel.endsWith(".md")) continue;
    const full = join(folder, rel);
    const raw = tryCatch(() => readFileSync(full, "utf8"));
    if (!raw.ok || !raw.value.includes("<!-- if:")) continue;
    writeFileSync(full, resolveConditionals(raw.value, avail));
  }
}

function refreshSkillDir(ctx: Ctx, name: string, rel: string, installed: ReadonlySet<string>): void {
  if (ctx.dryRun) return;
  rmSync(join(ctx.dest, rel), { recursive: true, force: true });
  cpSync(join(ctx.kit, "skills", name), join(ctx.dest, rel), { recursive: true, dereference: true });
  patchLenses(join(ctx.dest, rel), installed);
  patchConditionals(join(ctx.dest, rel), ctx.avail);
}

function installContent(ctx: Ctx, content: ReturnType<typeof plan>): Map<string, string> {
  const installed = new Set([...content.skills, ...content.agents]);
  const skillDest = new Map<string, string>();
  for (const name of content.skills) {
    const rel = join(".agents", "skills", name);
    if (ctx.adopt) migrateSidecarSkillName(ctx, rel, name);
    if (ctx.adopt && treesMatch(join(ctx.kit, "skills", name), join(ctx.dest, rel), installed, ctx.avail)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      recordSkillDir(ctx, rel);
      skillDest.set(name, rel);
      continue;
    }
    if (ctx.adopt) {
      const via = manifestOwnsSkillDir(ctx, rel)
        ? "this install's record"
        : legacyOwnsSkillDir(ctx, name, join(ctx.dest, rel))
          ? "earlier kit copy"
          : undefined;
      if (via !== undefined) {
        const blocked = refreshBlocked(ctx, rel, join(ctx.kit, "skills", name));
        if (blocked !== undefined) {
          ctx.actions.push({ kind: "skip", path: rel, note: blocked });
        } else {
          ctx.actions.push({ kind: "copy", path: rel, note: `updated (${via})` });
          refreshSkillDir(ctx, name, rel, installed);
          recordSkillDir(ctx, rel);
        }
        skillDest.set(name, rel);
        continue;
      }
    }
    const destRel = place(ctx, "copy", rel, (target) => {
      cpSync(join(ctx.kit, "skills", name), join(ctx.dest, target), { recursive: true, dereference: true });
      patchLenses(join(ctx.dest, target), installed);
      patchConditionals(join(ctx.dest, target), ctx.avail);
      if (target !== rel) renameFreshSidecarSkill(join(ctx.dest, target), name);
    });
    if (destRel !== undefined) recordSkillDir(ctx, destRel);
    skillDest.set(name, destRel ?? rel);
  }
  for (const file of content.licences) {
    copyFile(ctx, join(ctx.kit, "skills", file), join(".agents", "skills", file));
  }
  copyFile(ctx, join(ctx.kit, "THIRD_PARTY_NOTICES.md"), join(".agents", "THIRD_PARTY_NOTICES.md"));
  if (content.personas) {
    copyFile(ctx, content.personas, join(".agents", "personas.md"));
  }
  // The policy file is meant to be edited, so it is never adopted: no
  // sidecar, an existing file is left alone. Policy defaults come from the
  // package at runtime, not from this stub.
  if (existsSync(join(ctx.kit, "tokenomics.template.md"))) {
    copyFile(ctx, join(ctx.kit, "tokenomics.template.md"), join(".agents", "tokenomics.md"));
  }
  // The atlas is project memory: edited by agents every session, so like the
  // policy file it is never adopted and an existing file is left alone.
  if (existsSync(join(ctx.kit, "atlas.template.md"))) {
    copyFile(ctx, join(ctx.kit, "atlas.template.md"), join(".agents", "atlas.md"));
  }
  for (const name of content.agents) {
    copyFile(ctx, join(ctx.kit, "agents", `${name}.md`), join(".agents", "agents", `${name}.md`));
  }
  for (const name of content.commands) {
    copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(".agents", "commands", `${name}.md`));
  }
  installAgentsMd(ctx);
  return skillDest;
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
  place(ctx, "write", rel, (destRel) => writeFileSync(join(ctx.dest, destRel), CURSOR_RULE));
}

function linkPresentSkills(
  ctx: Ctx,
  skillsRel: string,
  preset: readonly string[],
  skillDest: Map<string, string>,
): void {
  const installed = new Set([...ctx.avail.skills, ...ctx.avail.agents]);
  const names = new Set(preset);
  const listed = tryCatch(() => readdirSync(join(ctx.dest, ".agents", "skills"), { withFileTypes: true }));
  if (listed.ok) {
    for (const e of listed.value) {
      if (e.isDirectory()) names.add(e.name);
    }
  }
  for (const name of names) {
    const source = skillDest.get(name) ?? join(".agents", "skills", name);
    if (ctx.adopt) {
      const blockedFull = join(ctx.dest, skillsRel, name);
      const blocked = lstatOf(blockedFull);
      // A project skill dir claiming this name blocks the link. Link the kit
      // beside it as a renamed real copy instead: writing `name:` through a
      // link would rename the canonical source shared by all tools.
      if (blocked?.isDirectory() === true && !blocked.isSymbolicLink() && houseSkillName(blockedFull) === name) {
        const zkName = `zk-${name}`;
        const sidecarRel = join(skillsRel, zkName);
        if (layerSidecarUpToDate(ctx, name, sidecarRel, zkName, installed)) {
          ctx.actions.push({ kind: "skip", path: sidecarRel, note: "already installed" });
          recordSkillDir(ctx, sidecarRel);
          continue;
        }
        const blocker = sidecarBlocker(ctx, name, sidecarRel, installed);
        if (blocker !== undefined) {
          ctx.actions.push({ kind: "skip", path: sidecarRel, note: blocker });
          continue;
        }
        ctx.actions.push({
          kind: "copy",
          path: sidecarRel,
          note: `kit skill beside project ${name}; renamed to ${zkName} so /${name} resolves to one skill`,
        });
        copyLayerSkillSidecar(ctx, name, sidecarRel, installed);
        continue;
      }
    }
    link(ctx, join(skillsRel, name), join("..", "..", source));
  }
}

function wireSkillsDir(ctx: Ctx, skillsRel: string, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  const existing = lstatOf(join(ctx.dest, skillsRel));
  if (existing?.isDirectory() && !existing.isSymbolicLink()) {
    linkPresentSkills(ctx, skillsRel, content.skills, skillDest);
  } else {
    link(ctx, skillsRel, "../.agents/skills");
  }
}

function wireClaude(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  wireSkillsDir(ctx, join(".claude", "skills"), content, skillDest);
  // Agents are generated by `syncAgents`; commands stay a directory link.
  const layerRel = join(".claude", "commands");
  const layer = lstatOf(join(ctx.dest, layerRel));
  if (layer?.isDirectory() && !layer.isSymbolicLink()) {
    for (const name of content.commands) {
      copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(layerRel, `${name}.md`));
    }
  } else {
    link(ctx, layerRel, "../.agents/commands");
  }
  // Only when AGENTS.md is (or will be) a real file: never a dangling link.
  if (agentsMdReady(ctx)) link(ctx, "CLAUDE.md", "AGENTS.md");
  else ctx.actions.push({ kind: "skip", path: "CLAUDE.md", note: "AGENTS.md is not a file" });
}

function wireCursor(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  wireSkillsDir(ctx, join(".cursor", "skills"), content, skillDest);
  writeCursorRule(ctx);
}

function wireProvider(
  ctx: Ctx,
  provider: WireProvider,
  content: ReturnType<typeof plan>,
  skillDest: Map<string, string>,
): void {
  if (provider === "claude") wireClaude(ctx, content, skillDest);
  else if (provider === "cursor") wireCursor(ctx, content, skillDest);
  // Codex has no per-provider folder. Muse native files are written by
  // generateAgents into `.agents/agents`.
}

/**
 * Agents this run will generate: the preset, plus project agents already on
 * disk. Sidecars (`*.kit.md`) stay out. The precheck and `generateAgents`
 * both use this list, so a refusal sees every route that would be written.
 */
function generationAgentNames(dest: string, preset: readonly string[]): string[] {
  const names = new Set(preset);
  const onDisk = tryCatch(() => readdirSync(join(dest, ".agents", "agents")));
  if (onDisk.ok) {
    for (const file of onDisk.value) {
      if (file.endsWith(".md") && !file.endsWith(".kit.md")) names.add(file.slice(0, -3));
    }
  }
  return [...names].sort();
}

// Each tool's agent files are generated from `.agents/agents` and the policy,
// the same way `zedkit-ai sync` does. A project policy that does not parse
// must not stop an install, so the shipped defaults stand in and a note says so.
function generateAgents(ctx: Ctx, content: ReturnType<typeof plan>, providers: readonly string[]): void {
  const names = generationAgentNames(ctx.dest, content.agents);
  const agentsDir = join(ctx.dest, ".agents");
  let policy = loadPolicy(agentsDir);
  if (!policy.ok) {
    ctx.actions.push({ kind: "skip", path: join(".agents", "tokenomics.md"), note: `${policy.error.message}; models inherit until it is fixed` });
    policy = loadDefaults();
  }
  if (!policy.ok) throw policy.error;
  syncAgents(
    {
      dest: ctx.dest,
      write: !ctx.dryRun,
      providers,
      policy: policy.value,
      agentsDir,
      names,
      commands: {
        names: (() => {
          const listed = new Set(content.commands);
          const disk = tryCatch(() => readdirSync(join(agentsDir, "commands")));
          if (disk.ok) {
            for (const f of disk.value) if (f.endsWith(".md") && !f.endsWith(".kit.md")) listed.add(f.slice(0, -3));
          }
          return [...listed].sort();
        })(),
        source: (name) => {
          const disk = tryCatch(() => readFileSync(join(agentsDir, "commands", `${name}.md`), "utf8"));
          return disk.ok ? disk.value : undefined;
        },
      },
      avail: ctx.avail,
      ...(ctx.allowFast && { allowFast: true }),
      source: (name) => {
        const resolved = resolveAgentSource(ctx.dest, name, join(ctx.kit, "agents"));
        return resolved === undefined ? undefined : resolveIfNeeded(resolved, ctx.avail);
      },
    },
    ctx.actions,
  );
}

const SCRATCH_IGNORE = ".scratch/";

// Working plans default to `.scratch/` when no tracker is configured; keep
// them out of git. Owner content is never touched: only the exact missing
// line is appended, links are never written through, and a second run is a
// skip.
function ensureScratchIgnored(ctx: Ctx): void {
  const rel = ".gitignore";
  const entry = lstatOf(join(ctx.dest, rel));
  if (entry === undefined) {
    place(
      ctx,
      "write",
      rel,
      (destRel) => writeFileSync(join(ctx.dest, destRel), `# Local working plans and tickets (zedkit-ai)\n${SCRATCH_IGNORE}\n`),
      "ignores .scratch/",
    );
    return;
  }
  if (entry.isSymbolicLink()) {
    ctx.actions.push({ kind: "skip", path: rel, note: "link left alone; add .scratch/ inside its target to keep working plans local" });
    return;
  }
  if (!entry.isFile()) {
    ctx.actions.push({ kind: "skip", path: rel, note: "not a file, left untouched" });
    return;
  }
  const current = tryCatch(() => readFileSync(join(ctx.dest, rel), "utf8"));
  if (!current.ok) {
    ctx.actions.push({ kind: "skip", path: rel, note: "unreadable, left untouched" });
    return;
  }
  if (current.value.split("\n").some((line) => line.trim() === SCRATCH_IGNORE)) {
    ctx.actions.push({ kind: "skip", path: rel, note: "already ignores .scratch/" });
    return;
  }
  ctx.actions.push({ kind: "append", path: rel, note: "ignores .scratch/" });
  if (ctx.dryRun) return;
  const gap = current.value === "" || current.value.endsWith("\n") ? "" : "\n";
  writeFileSync(join(ctx.dest, rel), `${current.value}${gap}${SCRATCH_IGNORE}\n`);
}

/**
 * Install the kit into a project. The shared source (skills, subagents,
 * commands, AGENTS.md) is copied into `.agents/` (the project owns it from
 * then on); each chosen provider then gets its thin layer, links where the
 * provider follows them, real files where it does not. Existing files are
 * never overwritten: they are reported as skipped, except an existing
 * AGENTS.md missing the ladder, which gets the ladder section appended
 * (reported as `append`). With `adopt`, a colliding skill/agent/command
 * keeps the user file and the kit version is written beside it. A bad
 * preset or kit fails before anything is written. So does a refused route
 * for any agent generation will write (the preset plus agents already on
 * disk). `.gitignore` gains the `.scratch/` line for git-ignored local
 * working plans.
 */
export function installKit(options: InstallOptions): Result<Action[]> {
  const kit = options.kit ?? kitDir();
  const manifest = readManifest(kit);
  if (!manifest.ok) return err(manifest.error);
  const ctx: Ctx = {
    dest: options.dest,
    kit,
    dryRun: options.dryRun ?? false,
    adopt: options.adopt ?? false,
    allowFast: options.allowFast === true,
    actions: [],
    avail: { skills: new Set(), agents: new Set(), commands: new Set() },
    priorManifest: readInstalledManifest(options.dest),
    written: new Map(),
  };
  const run = tryCatch(() => {
    const content = plan(kit, manifest.value, options.preset ?? "starter");
    ctx.avail = {
      skills: new Set(content.skills),
      agents: new Set(content.agents),
      commands: new Set(content.commands),
    };
    const chosen = (options.providers ?? options.targets ?? ALL_PROVIDERS) as WireProvider[];
    const agentsDir = join(ctx.dest, ".agents");
    const policy = loadPolicy(agentsDir);
    if (policy.ok) {
      assertAgentRoutes({
        policy: policy.value,
        agentsDir,
        names: generationAgentNames(ctx.dest, content.agents),
        providers: chosen,
        ...(ctx.allowFast && { allowFast: true }),
      });
    }
    const skillDest = installContent(ctx, content);
    for (const provider of chosen) {
      wireProvider(ctx, provider, content, skillDest);
    }
    generateAgents(ctx, content, chosen);
    ensureScratchIgnored(ctx);
  });
  if (run.ok && !ctx.dryRun) {
    // Re-hash every file this run wrote: later steps (agent generation) may
    // have replaced what an earlier step recorded, and only final bytes count.
    for (const action of ctx.actions) {
      if (action.kind !== "copy" && action.kind !== "write" && action.kind !== "generate" && action.kind !== "append") {
        continue;
      }
      const st = tryCatch(() => statSync(join(ctx.dest, action.path)));
      if (!st.ok || !st.value.isFile()) continue;
      const hash = diskHash(join(ctx.dest, action.path));
      if (hash !== undefined) ctx.written.set(manifestKey(action.path), hash);
    }
    // Keep records for files this run did not touch.
    for (const [rel, hash] of ctx.priorManifest.status === "ok" ? Object.entries(ctx.priorManifest.manifest.files) : []) {
      if (!ctx.written.has(rel)) ctx.written.set(rel, hash);
    }
    const save = tryCatch(() =>
      writeInstalledManifest(ctx.dest, { schema: 1, kit: kitVersion(kit), files: Object.fromEntries(ctx.written) }),
    );
    if (!save.ok) return err(save.error);
  }
  return run.ok ? ok(ctx.actions) : err(run.error);
}
