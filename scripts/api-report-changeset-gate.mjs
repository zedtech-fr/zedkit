#!/usr/bin/env node
// Changeset gate for API reports vs origin/main.
// A report that only adds exports already present in origin/main source
// is catching up a stale report after a Version PR; do not demand a
// second bump. New or removed exports still need a changeset.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const NAME_RE = /^["']([^"']+)["']\s*:\s*(patch|minor|major)/;
const ADDED_EXPORT_RE =
  /^\+export (?:declare )?(?:async )?(?:function|class|interface|type|enum|const|let|var|namespace) ([A-Za-z_$][\w$]*)/u;

/**
 * @param {string} diff
 * @returns {string[]}
 */
export function addedExportNames(diff) {
  const names = [];
  for (const line of diff.split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const match = ADDED_EXPORT_RE.exec(line);
    if (match) names.push(match[1]);
  }
  return names;
}

/**
 * @param {string} source
 * @param {string} name
 */
export function sourceHasExport(source, name) {
  if (!name) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "u").test(source);
}

/**
 * @param {{ diff: string, kinds: Set<string>, mainSource: string }} input
 * @returns {{ ok: boolean, skip?: string, error?: string }}
 */
export function evaluateReportChange({ diff, kinds, mainSource }) {
  if (!diff.trim()) return { ok: true };
  const removed = diff.split("\n").some((line) => line.startsWith("-export "));
  const added = addedExportNames(diff);
  const catchUp =
    !removed &&
    added.length > 0 &&
    Boolean(mainSource) &&
    added.every((name) => sourceHasExport(mainSource, name));
  if (kinds.size === 0) {
    if (catchUp) return { ok: true, skip: "already-on-main" };
    return { ok: false, error: "add a changeset" };
  }
  if (removed && !kinds.has("minor") && !kinds.has("major")) {
    return { ok: false, error: "removed needs minor/major" };
  }
  return { ok: true };
}

export function readChangesetBumps(root = ".") {
  const dir = join(root, ".changeset");
  /** @type {Map<string, Set<string>>} */
  const bumps = new Map();
  if (!existsSync(dir)) return bumps;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(dir, name), "utf8");
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    for (const line of text.slice(4, end).split("\n")) {
      const match = NAME_RE.exec(line.trim());
      if (!match) continue;
      const set = bumps.get(match[1]) ?? new Set();
      set.add(match[2]);
      bumps.set(match[1], set);
    }
  }
  return bumps;
}

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

function readMainSource(pkg) {
  for (const rel of [
    `packages/${pkg}/src/index.ts`,
    `packages/${pkg}/src/index.tsx`,
    `packages/${pkg}/src/index.mts`,
    `packages/${pkg}/src/index.d.mts`,
  ]) {
    const shown = git(["show", `origin/main:${rel}`]);
    if (shown.status === 0) return shown.stdout;
  }
  return "";
}

export function runChangesetGate({
  headRef = process.env.GITHUB_HEAD_REF ?? "",
  specs,
  root = ".",
} = {}) {
  if (headRef === "changeset-release/main") {
    return { ok: true, skipped: "version-pr" };
  }
  const probe = git(["rev-parse", "--verify", "origin/main"]);
  if (probe.status !== 0) return { ok: true, skipped: "no-origin-main" };

  const bumps = readChangesetBumps(root);
  const errors = [];
  const skipped = [];
  for (const spec of specs) {
    const [pkg, , report] = spec.split("|");
    const path = `packages/${pkg}/etc/${report}`;
    const npmPkg = `@zedtech/zedkit-${pkg}`;
    const existed = git(["cat-file", "-e", `origin/main:${path}`]);
    if (existed.status !== 0) continue;
    const diff = git(["diff", "origin/main", "HEAD", "--", path]);
    if (diff.status !== 0) {
      errors.push(`${path}: git diff failed`);
      continue;
    }
    const result = evaluateReportChange({
      diff: diff.stdout,
      kinds: bumps.get(npmPkg) ?? new Set(),
      mainSource: readMainSource(pkg),
    });
    if (result.skip === "already-on-main") {
      skipped.push(path);
      continue;
    }
    if (result.ok) continue;
    if (result.error === "add a changeset") {
      errors.push(`${path}: API report changed; add a changeset for ${npmPkg}`);
    } else if (result.error === "removed needs minor/major") {
      errors.push(
        `${path}: removed or renamed export needs a minor (0.x breaking) or major changeset for ${npmPkg}`,
      );
    } else {
      errors.push(`${path}: ${result.error}`);
    }
  }
  return { ok: errors.length === 0, errors, skipped };
}

function main() {
  const specs = process.argv.slice(2);
  if (specs.length === 0) {
    console.error("api-report: no entries");
    process.exit(1);
  }
  const result = runChangesetGate({ specs });
  if (result.skipped === "version-pr") {
    console.log("api-report: skip changeset gate on version PR");
    return;
  }
  if (result.skipped === "no-origin-main") {
    console.log("api-report: no origin/main, skip changeset gate");
    return;
  }
  for (const path of result.skipped ?? []) {
    console.log(`${path}: API report catch-up of exports already on origin/main`);
  }
  if (!result.ok) {
    for (const msg of result.errors) console.error(msg);
    console.error("api-report: changeset gate FAILED");
    process.exit(1);
  }
  console.log("api-report: changeset gate ok");
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main();
}
