// Original work by the same author.
// Deterministic inventory of the AI kit, maintenance burden, and observed
// session cost — three separate figures, never mixed.
//
// - inventory: what setup distributes (skill/agent/command names from the kit
//   tree, file and word counts under the installed dirs). Computed from the
//   repo only; same tree, same bytes.
// - maintenance: derived files that must be regenerated, with the command that
//   regenerates them (the cost of keeping copies in sync).
// - sessionCost: observed tool calls from an explicit local session log passed
//   via --session-log. Without a log the status is "unavailable": transcript
//   figures are never quoted from memory and inventory counts never stand in
//   for observed cost.
//
// Usage:
//   node scripts/kit-inventory.mjs
//   node scripts/kit-inventory.mjs --session-log <path-to-session.jsonl>
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tryCatch } from "@zedtech/zedkit-core";

const aiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const kit = join(aiRoot, "kit");
const INSTALLED_DIRS = ["skills", "agents", "commands"];

function sortedNames(dir, { directoriesOnly = false, extension = "" } = {}) {
  const entries = tryCatch(() => readdirSync(dir, { withFileTypes: true }));
  if (!entries.ok) return [];
  return entries.value
    .filter((entry) => (directoriesOnly ? entry.isDirectory() : entry.isFile() && entry.name.endsWith(extension)))
    .map((entry) => (extension === "" ? entry.name : entry.name.slice(0, -extension.length)))
    .sort();
}

function walkFiles(dir, out = []) {
  const entries = tryCatch(() => readdirSync(dir, { withFileTypes: true }));
  if (!entries.ok) return out;
  for (const entry of entries.value.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    else if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function wordsOf(text) {
  const words = text.split(/\s+/).filter((word) => word !== "");
  return words.length;
}

/** Repo-derived inventory: names, file count, word count. No transcripts. */
export function inventoryKit(kitDir = kit) {
  const skills = sortedNames(join(kitDir, "skills"), { directoriesOnly: true });
  const agents = sortedNames(join(kitDir, "agents"), { extension: ".md" });
  const commands = sortedNames(join(kitDir, "commands"), { extension: ".md" });
  const files = INSTALLED_DIRS.flatMap((sub) => walkFiles(join(kitDir, sub)));
  let words = 0;
  for (const file of files) words += wordsOf(readFileSync(file, "utf8"));
  return {
    scope: INSTALLED_DIRS.map((sub) => `packages/ai/kit/${sub}`),
    skills: { count: skills.length, names: skills },
    agents: { count: agents.length, names: agents },
    commands: { count: commands.length, names: commands },
    files: files.length,
    words,
  };
}

/** Derived files that must be regenerated: the maintenance burden, with its commands. */
export function maintenanceBurden() {
  return {
    note: "Every entry below is generated from a source of truth; hand-editing the copy instead of the source is drift.",
    derived: [
      {
        file: "packages/ai/kit/legacy-hashes.json",
        regen: "pnpm --filter @zedtech/zedkit-ai build && node packages/ai/scripts/legacy-hashes.mjs",
      },
      {
        file: "apps/docs/lib/ai-setup-onboarding.generated.ts",
        regen: "pnpm --filter @zedtech/zedkit-docs docs:generate",
      },
    ],
  };
}

function countTools(payload) {
  const record = payload?.record;
  return typeof record?.tool_name === "string" ? record.tool_name : undefined;
}

/**
 * Observed cost from an explicit local session log (JSONL, one record per
 * line with a string payload_type). Unknown lines are counted as unparsed,
 * never silently dropped; unknown formats resolve to "unrecognized-format",
 * never to invented figures.
 */
export function parseSessionLog(text) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  let started = 0;
  let terminal = 0;
  let commands = 0;
  let unparsed = 0;
  let typed = 0;
  const byTool = {};
  for (const line of lines) {
    const parsed = tryCatch(() => JSON.parse(line));
    if (!parsed.ok) {
      unparsed += 1;
      continue;
    }
    const record = parsed.value;
    if (typeof record?.payload_type !== "string") {
      unparsed += 1;
      continue;
    }
    typed += 1;
    if (record.payload_type === "tool_batch.effect.started") {
      started += 1;
      const tool = countTools(record.payload);
      if (tool !== undefined) byTool[tool] = (byTool[tool] ?? 0) + 1;
    } else if (record.payload_type === "tool_batch.effect.terminal") {
      terminal += 1;
    } else if (record.payload_type === "command.invoked") {
      commands += 1;
    }
  }
  if (typed === 0) return { status: "unrecognized-format", lines: lines.length };
  return { status: "observed", lines: lines.length, toolStarted: started, toolTerminal: terminal, commands, byTool, unparsed };
}

function main(argv) {
  const flag = argv.indexOf("--session-log");
  const inventory = inventoryKit();
  const maintenance = maintenanceBurden();
  if (flag === -1) {
    return {
      scope: inventory.scope,
      inventory,
      maintenance,
      sessionCost: {
        status: "unavailable",
        reason: "pass --session-log <path-to-session.jsonl> for observed cost; transcript figures are never quoted from memory",
      },
    };
  }
  const path = argv[flag + 1];
  if (path === undefined) throw new Error("missing path after --session-log");
  return { scope: inventory.scope, inventory, maintenance, sessionCost: parseSessionLog(readFileSync(path, "utf8")) };
}

const invoked = process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invoked) {
  const out = tryCatch(() => main(process.argv.slice(2)));
  if (!out.ok) {
    const error = out.error;
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${JSON.stringify(out.value, null, 2)}\n`);
  }
}
