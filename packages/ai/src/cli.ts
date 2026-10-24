// Original work by the same author.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { err, ok, tryCatch, type Result } from "@zedkit/core";
import { installKit, type Target } from "./install.js";
import { readManifest } from "./kit.js";
import { validateKit } from "./validate.js";

const USAGE = `zedkit-ai <command>

  init [dir] [--preset core|full] [--target claude,cursor] [--dry-run]
      Copy skills, subagents, commands and an AGENTS.md template into dir
      (default .), and link the tool folders. Never overwrites existing files.
  validate [dir]
      Check skills and subagents (default dir: .agents). Exit 1 on problems.
  list
      Show presets and subagents.
`;

/** Where the CLI writes: normal lines and error lines. */
export type Sinks = { out: (line: string) => void; err: (line: string) => void };

type Parsed = { values: Record<string, string | boolean | undefined>; positionals: string[] };

const OPTIONS = {
  preset: { type: "string" },
  target: { type: "string" },
  "dry-run": { type: "boolean" },
} as const;

function parse(args: string[], options: Record<string, never> | typeof OPTIONS, maxPositionals: number): Result<Parsed> {
  const parsed = tryCatch(() => parseArgs({ args, allowPositionals: true, options }));
  if (!parsed.ok) return err(parsed.error);
  if (parsed.value.positionals.length > maxPositionals) {
    return err(new Error(`unexpected argument "${parsed.value.positionals[maxPositionals]}"`));
  }
  return ok(parsed.value as Parsed);
}

function parseTargets(value: string | boolean | undefined): Result<Target[] | undefined> {
  if (value === undefined) return ok(undefined);
  const names = String(value).split(",").map((s) => s.trim());
  const bad = names.find((n) => n !== "claude" && n !== "cursor");
  return bad !== undefined ? err(new Error(`unknown target "${bad}" (claude, cursor)`)) : ok(names as Target[]);
}

function fail(message: string, sinks: Sinks): number {
  sinks.err(`error: ${message}`);
  return 2;
}

function runInit(args: string[], sinks: Sinks): number {
  const parsed = parse(args, OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const { values, positionals } = parsed.value;
  const targets = parseTargets(values.target);
  if (!targets.ok) return fail(targets.error.message, sinks);
  const dryRun = values["dry-run"] === true;
  const preset = typeof values.preset === "string" ? values.preset : undefined;
  const result = installKit({
    dest: resolve(positionals[0] ?? "."),
    ...(preset !== undefined && { preset }),
    ...(targets.value !== undefined && { targets: targets.value }),
    dryRun,
  });
  if (!result.ok) return fail(result.error.message, sinks);
  for (const action of result.value) {
    sinks.out(`${action.kind.padEnd(5)} ${action.path}${action.note ? `  (${action.note})` : ""}`);
  }
  sinks.out(dryRun ? "dry run: nothing written" : "next: ask your agent to run the `setup-ai` skill, then `zedkit-ai validate`");
  return 0;
}

function runValidate(args: string[], sinks: Sinks): number {
  const parsed = parse(args, {}, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const dir = resolve(parsed.value.positionals[0] ?? ".agents");
  if (!existsSync(dir)) return fail(`no such directory: ${dir}`, sinks);
  const issues = validateKit(dir);
  for (const issue of issues) sinks.out(`${issue.path}: ${issue.message}`);
  sinks.out(issues.length === 0 ? "ok" : `${issues.length} problem(s)`);
  return issues.length === 0 ? 0 : 1;
}

function runList(args: string[], sinks: Sinks): number {
  const parsed = parse(args, {}, 0);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const manifest = readManifest();
  if (!manifest.ok) return fail(manifest.error.message, sinks);
  for (const [name, skills] of Object.entries(manifest.value.presets)) {
    sinks.out(`preset ${name}: ${skills === "*" ? "every skill" : skills.join(", ")}`);
  }
  sinks.out(`agents: ${manifest.value.agents.join(", ")}`);
  sinks.out(`commands: ${(manifest.value.commands ?? []).join(", ") || "(none)"}`);
  return 0;
}

/** Run the CLI. Returns the process exit code (0 ok, 1 validation problems, 2 usage or runtime error). */
export function main(argv: string[], sinks: Sinks): number {
  const [command, ...rest] = argv;
  if (command === "init") return runInit(rest, sinks);
  if (command === "validate") return runValidate(rest, sinks);
  if (command === "list") return runList(rest, sinks);
  const help = command === undefined || command === "--help" || command === "-h";
  (help ? sinks.out : sinks.err)(USAGE.trimEnd());
  return help ? 0 : 2;
}
