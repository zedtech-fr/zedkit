#!/usr/bin/env node
/**
 * Compact command runner for coding agents: a short PASS/FAIL summary on
 * stdout, full tool output in gitignored `.agent-logs/`. Node builtins only.
 *
 *   pnpm agent test|node-test|e2e|lint|typecheck|diff|status|pr
 *   node scripts/agent/run.mjs <task> [args...]
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const TASKS = ["test", "node-test", "e2e", "lint", "typecheck", "diff", "status", "pr"];

export const LIMITS = {
  failLines: 30,
  lintRows: 20,
  tscRows: 20,
  diffLines: 80,
};

export const DIFF_EXCLUDES = [":!pnpm-lock.yaml", ":!**/registry.json", ":!docs/catalog/catalog.json"];

export const USAGE = `usage: pnpm agent <task> [args...]
       node scripts/agent/run.mjs <task> [args...]
tasks:
  test [pkg-or-filter...]   turbo test --output-logs=errors-only
  node-test [globs...]      node --test (default: test:registry:nodeploy globs)
  e2e [spec-or-args...]     Playwright line+json (apps/docs)
  lint [pkg...]             eslint --format json (not docs extra checks)
  typecheck [pkg...]        turbo typecheck, tsc --pretty false
  diff [base]               git diff -U1 (lockfile/catalog/registry omitted)
  status                    git status --porcelain=v1 -b + diff --stat
  pr [n]                    gh pr view/checks JSON (failing/pending only)
logs: .agent-logs/<timestamp>-<pid>-<task>.log  (gitignored)
  test also routes node --test targets (.mjs/.cjs or scripts|apps/docs|deploy|packages/ai/scripts)
  * globs peel only in those dirs or with a .mjs/.cjs suffix
  Peel when every non-flag target is a node-test target (no --filter/@),
  or with leading --test / node --test; vitest --reporter flags are dropped on peel
`;

const MAX_BUFFER = 64 * 1024 * 1024;
const ANSI = new RegExp(`${String.fromCharCode(27)}(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])`, "g");
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const PKG_FROM_PATH = /^(packages\/[^/]+|apps\/[^/]+)/;
const TSC_PARENS = /^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;
const TSC_PRETTY = /^(.+):(\d+):(\d+)\s+-\s+error\s+(TS\d+):\s+(.+)$/;

export function stripAnsi(text) {
  return String(text ?? "").replace(ANSI, "");
}

export function capLines(text, max = LIMITS.failLines) {
  const raw = String(text ?? "");
  const lines = raw.split("\n");
  if (lines.length <= max) return raw;
  const omitted = lines.length - max;
  return `${lines.slice(0, max).join("\n")}\n… truncated ${omitted} more lines`;
}

export function relPath(file, cwd) {
  if (!file) return "";
  const root = resolve(cwd);
  const abs = resolve(root, file);
  const out = relative(root, abs);
  return out.startsWith("..") ? file.replaceAll("\\", "/") : out.replaceAll("\\", "/");
}

export function stamp(date, pid = process.pid) {
  return `${date.toISOString().replaceAll(":", "-").replaceAll(".", "-")}-${pid}`;
}

export function formatDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return "0.0s";
  if (n < 60_000) return `${(n / 1000).toFixed(1)}s`;
  const minutes = Math.floor(n / 60_000);
  let seconds = Math.round((n % 60_000) / 1000);
  if (seconds === 60) return `${minutes + 1}m 00s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function isExcludedDiffPath(file) {
  const n = String(file ?? "").replaceAll("\\", "/");
  return n === "pnpm-lock.yaml" || n === "docs/catalog/catalog.json" || n === "registry.json" || n.endsWith("/registry.json");
}

export function isTestFileArg(arg) {
  const n = String(arg).replaceAll("\\", "/");
  return TEST_FILE.test(n) || /(?:^|\/)tests?\//.test(n);
}

export function packageFilterFromPath(file) {
  const n = String(file).replaceAll("\\", "/").replace(/^\.\//, "");
  const match = PKG_FROM_PATH.exec(n);
  return match ? `--filter=./${match[1]}` : null;
}

export function splitTestArgs(args) {
  const filters = [];
  const extra = [];
  const files = [];
  const seen = new Set();
  const addFilter = (flag) => {
    if (seen.has(flag)) return;
    seen.add(flag);
    filters.push(flag);
  };
  for (const arg of args) {
    if (arg === "--") continue;
    if (arg.startsWith("--filter=")) {
      addFilter(arg);
      continue;
    }
    if (arg === "--filter") continue;
    if (arg.startsWith("-")) {
      extra.push(arg);
      continue;
    }
    if (isTestFileArg(arg)) {
      files.push(arg);
      const flag = packageFilterFromPath(arg);
      if (flag) addFilter(flag);
      continue;
    }
    addFilter(`--filter=${arg}`);
  }
  return { filters, extra, files };
}

export function stripVitestReporterArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--reporter") {
      const next = args[i + 1];
      if (next !== undefined && !String(next).startsWith("-")) i += 1;
      continue;
    }
    if (String(arg).startsWith("--reporter=")) continue;
    out.push(arg);
  }
  return out;
}

export function buildTestArgv(args) {
  const { filters, extra, files } = splitTestArgs(args);
  const passthrough = [...extra, ...files];
  // Do not inject --reporter after --: pnpm appends it to chained scripts
  // (devtools: vitest run && node --test), and node exits 9 on unknown flags.
  if (passthrough.length === 0) {
    return ["turbo", "run", "test", "--output-logs=errors-only", ...filters];
  }
  return ["turbo", "run", "test", "--output-logs=errors-only", ...filters, "--", ...passthrough];
}

export function buildTypecheckArgv(args) {
  const files = args.filter(isTestFileArg);
  const rest = args.filter((arg) => !isTestFileArg(arg));
  const split = splitTestArgs(rest);
  const filters = [...split.filters];
  for (const file of files) {
    const flag = packageFilterFromPath(file);
    if (flag && !filters.includes(flag)) filters.push(flag);
  }
  if (files.length > 0 && filters.length === 0) return null;
  const extra = split.extra;
  const pretty = extra.includes("--pretty") || extra.includes("--pretty=false") ? extra : ["--pretty", "false", ...extra];
  return ["turbo", "run", "typecheck", "--output-logs=errors-only", ...filters, "--", ...pretty];
}

export function resolveLintTargets(args, cwd) {
  if (args.length === 0) return ["."];
  return args.map((arg) => {
    if (arg.startsWith("-")) return arg;
    if (existsSync(resolve(cwd, arg))) return arg;
    const short = arg.replace(/^@zedtech\/zedkit-/, "").replace(/^zedkit-/, "");
    for (const dir of [join(cwd, "packages", short), join(cwd, "apps", short)]) {
      if (existsSync(dir)) return relative(cwd, dir) || dir;
    }
    return arg;
  });
}

export function buildLintArgv(args, cwd) {
  return ["exec", "eslint", "--format", "json", "--no-error-on-unmatched-pattern", ...resolveLintTargets(args, cwd)];
}

export function buildE2eArgv(args) {
  const specs = args.map((arg) => arg.replace(/^(?:\.\/)?apps\/docs\//, ""));
  const reporter = ["--reporter=line", "--reporter=json"];
  if (specs.length === 0) {
    return ["--filter", "@zedtech/zedkit-docs", "run", "e2e", "--", ...reporter];
  }
  return ["--filter", "@zedtech/zedkit-docs", "exec", "playwright", "test", ...reporter, ...specs];
}

export function defaultNodeTestGlobs(cwd) {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return [];
  const pkg = parseJson(readFileSync(pkgPath, "utf8"));
  const script = pkg && typeof pkg === "object" ? pkg.scripts?.["test:registry:nodeploy"] : "";
  if (typeof script !== "string") return [];
  return [...script.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "").filter(Boolean);
}

const NODE_TEST_DIR = /^(?:\.\/)?(?:scripts|apps\/docs|deploy|packages\/ai\/scripts)(?:\/|$)/;

export function isNodeTestTarget(arg) {
  if (arg.startsWith("-")) return false;
  const n = String(arg).replaceAll("\\", "/");
  const inNodeTestDir = NODE_TEST_DIR.test(n);
  const nodeTestFile = n.endsWith(".mjs") || n.endsWith(".cjs");
  if (n.includes("*")) return inNodeTestDir || nodeTestFile;
  return nodeTestFile || inNodeTestDir;
}

export function peelNodeTestArgs(args) {
  if (args[0] === "node" && args[1] === "--test") {
    return { nodeTest: true, rest: stripVitestReporterArgs(args.slice(2)) };
  }
  if (args[0] === "--test") {
    return { nodeTest: true, rest: stripVitestReporterArgs(args.slice(1)) };
  }
  const stripped = stripVitestReporterArgs(args);
  const targets = stripped.filter((arg) => !arg.startsWith("-"));
  if (
    targets.length > 0 &&
    targets.every(isNodeTestTarget) &&
    !stripped.some((arg) => arg.startsWith("--filter") || arg.startsWith("@"))
  ) {
    return { nodeTest: true, rest: stripped };
  }
  return { nodeTest: false, rest: args };
}

export function buildNodeTestArgv(args, { cwd, execPath = process.execPath } = {}) {
  const globs = args.length > 0 ? args : defaultNodeTestGlobs(cwd ?? process.cwd());
  if (globs.length === 0) return { error: "node-test: no globs (expected test:registry:nodeploy or explicit paths)" };
  return { command: execPath, argv: ["--test", ...globs] };
}

export function parseCountBit(bit) {
  const failed = Number(bit.match(/(\d+)\s+failed/)?.[1] ?? 0);
  const passed = Number(bit.match(/(\d+)\s+passed/)?.[1] ?? 0);
  const skipped = Number(bit.match(/(\d+)\s+skipped/)?.[1] ?? 0);
  const total = Number(bit.match(/\((\d+)\)/)?.[1] ?? failed + passed + skipped);
  return { failed, passed, skipped, total };
}

export function parseVitestStats(text) {
  const clean = stripAnsi(text);
  const files = clean.match(/Test Files\s+(.+)/);
  const tests = clean.match(/^\s*Tests\s+(.+)$/m);
  return {
    files: files ? parseCountBit(files[1] ?? "") : { failed: 0, passed: 0, skipped: 0, total: 0 },
    tests: tests ? parseCountBit(tests[1] ?? "") : { failed: 0, passed: 0, skipped: 0, total: 0 },
  };
}

export function parseVitestFailures(text) {
  const clean = stripAnsi(text);
  const failures = [];
  const failRe = /^\s*FAIL\s+(\S+)(?:\s+>\s+(.+))?$/gm;
  let match = failRe.exec(clean);
  while (match) {
    failures.push({ file: match[1], title: (match[2] ?? "").trim(), line: undefined, message: "" });
    match = failRe.exec(clean);
  }
  const locRe = /^\s*[❯>]\s+(\S+)/gm;
  const locs = [];
  match = locRe.exec(clean);
  while (match) {
    locs.push(parseLocation(match[1]));
    match = locRe.exec(clean);
  }
  for (let i = 0; i < failures.length && i < locs.length; i += 1) {
    const loc = locs[i];
    const row = failures[i];
    if (!loc || !row) continue;
    if (loc.line != null) row.line = loc.line;
    if (!row.file && loc.file) row.file = loc.file;
  }
  const msgRe = /^(?:AssertionError|Error):\s+(.+)$/gm;
  const msgs = [];
  match = msgRe.exec(clean);
  while (match) {
    msgs.push(match[1] ?? "");
    match = msgRe.exec(clean);
  }
  for (let i = 0; i < failures.length && i < msgs.length; i += 1) {
    const row = failures[i];
    if (row) row.message = msgs[i] ?? "";
  }
  return failures;
}

function formatFailureRows(failures, cwd) {
  return failures.map((row) => {
    const file = relPath(row.file ?? "", cwd);
    const loc = row.line ? `${file}:${row.line}` : file;
    const bits = [loc, row.title, row.message].filter(Boolean);
    return bits.join("  ");
  });
}

export function formatTestSummary({ raw, status, ms, logPath, cwd = process.cwd() }) {
  const stats = parseVitestStats(raw);
  const failures = parseVitestFailures(raw);
  const tag = status === 0 ? "PASS" : "FAIL";
  const tests = stats.tests.total
    ? stats.tests.failed
      ? `tests=${stats.tests.failed} failed / ${stats.tests.total}`
      : `tests=${stats.tests.total}`
    : "";
  const files = stats.files.total
    ? stats.files.failed
      ? `files=${stats.files.failed} failed / ${stats.files.total}`
      : `files=${stats.files.total}`
    : "";
  const head = [tag, tests, files, formatDuration(ms)].filter(Boolean).join("  ");
  const rows = formatFailureRows(failures, cwd);
  if (status !== 0 && rows.length === 0 && !stats.tests.total) {
    const excerpt = capLines(stripAnsi(raw).trim(), 10);
    return [head, excerpt, `LOG  ${logPath}`].filter(Boolean).join("\n") + "\n";
  }
  const body = capLines(rows.join("\n"), LIMITS.failLines);
  return [head, body, `LOG  ${logPath}`].filter(Boolean).join("\n") + "\n";
}

function parseLocation(raw) {
  const n = String(raw ?? "")
    .trim()
    .replace(/^file:\/\//, "");
  const withCol = /^(.*?):(\d+):(\d+)$/.exec(n);
  if (withCol) return { file: withCol[1], line: Number(withCol[2]), col: Number(withCol[3]) };
  const withLine = /^(.*?):(\d+)$/.exec(n);
  if (withLine) return { file: withLine[1], line: Number(withLine[2]) };
  return { file: n, line: undefined };
}

function firstErrorLine(block) {
  const folded = block.match(/error: \|-\n([\s\S]*?)(?=\n {2}\w+:|\n {2}\.\.\.)/);
  const quoted = block.match(/error: '([^']*)'/) ?? block.match(/error: "([^"]*)"/);
  const blob = folded?.[1] ?? quoted?.[1] ?? "";
  return blob
    .split("\n")
    .map((line) => line.replace(/^\s+/, "").trim())
    .find(Boolean) ?? "";
}

export function parseNodeTestStats(text) {
  const clean = stripAnsi(text);
  const num = (re) => {
    const match = clean.match(re);
    return match ? Number(match[1]) : undefined;
  };
  return {
    tests: num(/^# tests (\d+)/m) ?? num(/^ℹ tests (\d+)/m) ?? 0,
    pass: num(/^# pass (\d+)/m) ?? num(/^ℹ pass (\d+)/m) ?? 0,
    fail: num(/^# fail (\d+)/m) ?? num(/^ℹ fail (\d+)/m) ?? 0,
    skipped: num(/^# skipped (\d+)/m) ?? num(/^ℹ skipped (\d+)/m) ?? 0,
    durationMs: num(/^# duration_ms ([\d.]+)/m) ?? num(/^ℹ duration_ms ([\d.]+)/m),
  };
}

export function parseNodeTestFailures(text) {
  const clean = stripAnsi(text);
  const failures = [];
  const tapRe = /^not ok \d+ - (.+)$/gm;
  let match = tapRe.exec(clean);
  while (match) {
    const title = (match[1] ?? "").trim();
    const after = clean.slice(match.index + match[0].length, match.index + match[0].length + 4000);
    const locRaw = after.match(/location:\s+'([^']+)'/) ?? after.match(/location:\s+"([^"]+)"/);
    const loc = locRaw ? parseLocation(locRaw[1]) : { file: "", line: undefined };
    failures.push({ file: loc.file, line: loc.line, title, message: firstErrorLine(after) });
    match = tapRe.exec(clean);
  }
  if (failures.length > 0) return failures;
  const specRe = /^[✖×] (.+?)(?: \(\d+(?:\.\d+)?ms\))?$/gm;
  match = specRe.exec(clean);
  while (match) {
    const title = (match[1] ?? "").trim();
    const after = clean.slice(match.index + match[0].length, match.index + match[0].length + 2000);
    const locRaw =
      after.match(/\((?:file:\/\/)?([^):\s]+\.m?js):(\d+)(?::(\d+))?\)/) ??
      after.match(/(?:file:\/\/)?([^):\s]+\.m?js):(\d+)(?::(\d+))?/);
    const messageMatch = after.match(/^(?:AssertionError|Error)(?: \[[^\]]+\])?:(?:\s+(.*))?$/m);
    failures.push({
      file: locRaw?.[1] ?? "",
      line: locRaw ? Number(locRaw[2]) : undefined,
      title,
      message: (messageMatch?.[1] ?? "AssertionError").trim(),
    });
    match = specRe.exec(clean);
  }
  return failures;
}

export function formatNodeTestSummary({ raw, status, ms, logPath, cwd = process.cwd() }) {
  const stats = parseNodeTestStats(raw);
  const failures = parseNodeTestFailures(raw);
  const tag = status === 0 ? "PASS" : "FAIL";
  const tests = stats.tests
    ? stats.fail
      ? `tests=${stats.fail} failed / ${stats.tests}`
      : `tests=${stats.tests}`
    : "";
  const duration = formatDuration(stats.durationMs ?? ms);
  const head = [tag, tests, duration].filter(Boolean).join("  ");
  const body = capLines(formatFailureRows(failures, cwd).join("\n"), LIMITS.failLines);
  return [head, body, `LOG  ${logPath}`].filter(Boolean).join("\n") + "\n";
}

export function looksLikeJson(text) {
  const trimmed = String(text ?? "").trim();
  return trimmed.startsWith("[") || trimmed.startsWith("{");
}

export function parseJson(text) {
  const trimmed = String(text ?? "").trim();
  if (!looksLikeJson(trimmed)) return undefined;
  /* eslint-disable no-restricted-syntax -- scripts/agent is zero-dep; JSON.parse is the only throw */
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
  /* eslint-enable no-restricted-syntax */
}

export function groupLintMessages(files, cwd) {
  const errors = [];
  const byRule = new Map();
  let errorCount = 0;
  let warningCount = 0;
  for (const file of files ?? []) {
    const path = relPath(file.filePath ?? "", cwd);
    for (const msg of file.messages ?? []) {
      if (msg.severity === 1) warningCount += 1;
      if (msg.severity !== 2) continue;
      errorCount += 1;
      const rule = msg.ruleId ?? "unknown";
      byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
      errors.push({
        file: path,
        line: msg.line,
        rule,
        message: String(msg.message ?? "").replaceAll("\n", " "),
      });
    }
  }
  const rules = [...byRule.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { errorCount, warningCount, rules, errors };
}

export function formatLintSummary(files, { status, ms, logPath, cwd = process.cwd() }) {
  const grouped = groupLintMessages(files, cwd);
  if (status !== 0 && grouped.errorCount === 0 && (files?.length ?? 0) === 0) {
    return `FAIL  eslint output was not JSON  ${formatDuration(ms)}\nLOG  ${logPath}\n`;
  }
  if (status === 0 && grouped.errorCount === 0) {
    const warn = grouped.warningCount ? `  warnings=${grouped.warningCount}` : "";
    return `PASS${warn}  ${formatDuration(ms)}\nLOG  ${logPath}\n`;
  }
  const ruleBits = grouped.rules.map(([rule, count]) => `${rule} × ${count}`);
  const rows = grouped.errors
    .slice(0, LIMITS.lintRows)
    .map((row) => `${row.file}:${row.line ?? "?"}  ${row.rule}  ${row.message}`);
  const extra = grouped.errors.length > LIMITS.lintRows ? grouped.errors.length - LIMITS.lintRows : 0;
  const lines = [
    `FAIL  errors=${grouped.errorCount}  warnings=${grouped.warningCount}  ${formatDuration(ms)}`,
    ...ruleBits.map((bit) => `  ${bit}`),
    ...rows,
  ];
  if (extra) lines.push(`… truncated ${extra} more errors`);
  lines.push(`LOG  ${logPath}`);
  return `${lines.join("\n")}\n`;
}

export function stripTurboPrefix(line) {
  let out = String(line ?? "");
  for (let i = 0; i < 2; i += 1) {
    const next = out.replace(/^[@\w./-]+:\s?/, "");
    if (next === out) break;
    out = next;
  }
  return out;
}

export function parseTscErrors(text) {
  const clean = stripAnsi(text);
  const errors = [];
  for (const line of clean.split("\n")) {
    const stripped = stripTurboPrefix(line);
    const parens = TSC_PARENS.exec(stripped) ?? TSC_PARENS.exec(line);
    const pretty = TSC_PRETTY.exec(stripped) ?? TSC_PRETTY.exec(line);
    const match = parens ?? pretty;
    if (!match) continue;
    errors.push({
      file: match[1],
      line: Number(match[2]),
      col: Number(match[3]),
      code: match[4],
      message: match[5],
    });
  }
  return errors;
}

export function formatTypecheckSummary({ raw, status, ms, logPath, cwd = process.cwd() }) {
  const errors = parseTscErrors(raw);
  if (status === 0 && errors.length === 0) {
    return `PASS  ${formatDuration(ms)}\nLOG  ${logPath}\n`;
  }
  const rows = errors.slice(0, LIMITS.tscRows).map((row) => {
    const file = relPath(row.file, cwd);
    return `${file}(${row.line},${row.col}): ${row.code} ${row.message}`;
  });
  const extra = errors.length > LIMITS.tscRows ? errors.length - LIMITS.tscRows : 0;
  const lines = [`FAIL  errors=${errors.length || "?"}  ${formatDuration(ms)}`, ...rows];
  if (extra) lines.push(`… truncated ${extra} more errors`);
  lines.push(`LOG  ${logPath}`);
  return `${lines.join("\n")}\n`;
}

export function walkPlaywrightFailures(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  for (const suite of node.suites ?? []) walkPlaywrightFailures(suite, acc);
  for (const spec of node.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const result of test.results ?? []) {
        const failed = result.status === "failed" || result.status === "timedOut" || result.status === "interrupted";
        if (!failed) continue;
        const err = result.error ?? {};
        const traces = (result.attachments ?? [])
          .filter((item) => /trace/i.test(item.name ?? "") || /\.zip$/.test(item.path ?? ""))
          .map((item) => item.path)
          .filter(Boolean);
        acc.push({
          title: spec.title ?? test.title ?? "",
          file: spec.file ?? node.file ?? "",
          line: err.location?.line ?? spec.line,
          message: String(err.message ?? "").split("\n")[0] ?? "",
          traces,
        });
      }
    }
  }
  return acc;
}

export function formatE2eSummary({ raw, json, status, ms, logPath, jsonPath, cwd = process.cwd() }) {
  const stats = json?.stats ?? {};
  const failures = json ? walkPlaywrightFailures(json) : [];
  const unexpected = Number(stats.unexpected ?? failures.length);
  const expected = Number(stats.expected ?? 0);
  const skipped = Number(stats.skipped ?? 0);
  const tag = status === 0 ? "PASS" : "FAIL";
  const head = [
    tag,
    unexpected ? `failed=${unexpected}` : "",
    expected ? `passed=${expected}` : "",
    skipped ? `skipped=${skipped}` : "",
    formatDuration(ms || stats.duration),
  ]
    .filter(Boolean)
    .join("  ");
  const rows = [];
  for (const row of failures) {
    const file = relPath(row.file, cwd);
    const loc = row.line ? `${file}:${row.line}` : file;
    rows.push([loc, row.title, row.message].filter(Boolean).join("  "));
    for (const trace of row.traces) rows.push(`  trace  ${trace}`);
  }
  if (!json && status !== 0) {
    const excerpt = capLines(stripAnsi(raw).trim(), 10);
    if (excerpt) rows.push(excerpt);
  }
  const body = capLines(rows.join("\n"), LIMITS.failLines);
  const lines = [head, body, `LOG  ${logPath}`];
  if (jsonPath) lines.push(`JSON ${jsonPath}`);
  return `${lines.filter(Boolean).join("\n")}\n`;
}

export function formatDiff(diffText, { excluded = [], max = LIMITS.diffLines, logPath } = {}) {
  const trimmed = String(diffText ?? "").trimEnd();
  const lines = [];
  if (!trimmed) lines.push("diff  (empty)");
  else lines.push(capLines(trimmed, max));
  if (excluded.length) {
    lines.push("", `excluded (changed): ${excluded.join(", ")}`);
  }
  if (logPath) lines.push(`LOG  ${logPath}`);
  return `${lines.join("\n")}\n`;
}

export function formatStatus({ porcelain, stat }) {
  return [`${String(porcelain ?? "").trimEnd()}`, String(stat ?? "").trimEnd()].filter(Boolean).join("\n") + "\n";
}

function checkBucket(check) {
  const bucket = String(check.bucket ?? "").toLowerCase();
  if (bucket) return bucket;
  const state = String(check.state ?? "").toUpperCase();
  if (["SUCCESS", "SKIPPED", "NEUTRAL"].includes(state)) return "pass";
  if (["PENDING", "QUEUED", "IN_PROGRESS", "EXPECTED"].includes(state)) return "pending";
  if (["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE"].includes(state)) {
    return "fail";
  }
  return "pending";
}

export function formatPr({ view, checks, checksError }) {
  const number = view?.number != null ? `#${view.number}` : "PR";
  const state = view?.state ?? "?";
  const url = view?.url ?? "";
  const mergeable = view?.mergeable ?? "";
  const lines = [`${number}  ${state}  ${url}`.trim()];
  if (mergeable) lines.push(`mergeable  ${mergeable}`);
  if (checksError) {
    lines.push("checks  failed");
    lines.push(checksError);
    return `${lines.join("\n")}\n`;
  }
  const interesting = (checks ?? []).filter((check) => {
    const bucket = checkBucket(check);
    return bucket === "fail" || bucket === "pending" || bucket === "cancel";
  });
  if (interesting.length === 0) {
    lines.push("checks  all green");
  } else {
    for (const check of interesting) {
      const bucket = checkBucket(check).toUpperCase();
      lines.push([bucket, check.name, check.link].filter(Boolean).join("  "));
    }
  }
  return `${lines.join("\n")}\n`;
}

function write(deps, text) {
  const fn = deps.write ?? ((chunk) => process.stdout.write(chunk));
  fn(text.endsWith("\n") ? text : `${text}\n`);
}

function spawnEnv(deps, extra = {}) {
  const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", ...deps.env, ...extra.env };
  // A nested `node --test` must not inherit the parent runner context.
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function spawn(command, args, deps, extra = {}) {
  const fn = deps.spawn ?? spawnSync;
  return fn(command, args, {
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
    cwd: extra.cwd ?? deps.cwd ?? process.cwd(),
    env: extra.env ?? spawnEnv(deps, extra),
  });
}

function spawnStatus(result) {
  if (result.status != null) return result.status;
  if (result.signal) return 1;
  if (result.error) return 127;
  return 1;
}

function combined(result) {
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const err = result.error?.message ? String(result.error.message) : "";
  return [stdout, stderr, err].filter(Boolean).join("\n");
}

function ensureLogDir(deps) {
  const cwd = deps.cwd ?? process.cwd();
  const logDir = deps.logDir ?? join(cwd, ".agent-logs");
  mkdirSync(logDir, { recursive: true });
  return logDir;
}

function pidOf(deps) {
  return deps.pid ?? process.pid;
}

function writeTaskLog(task, raw, deps, started) {
  const when = started ?? deps.now?.() ?? new Date();
  const logDir = ensureLogDir(deps);
  const logPath = join(logDir, `${stamp(when, pidOf(deps))}-${task}.log`);
  writeFileSync(logPath, raw ?? "");
  return logPath;
}

function loggedSpawn(task, command, args, deps, extra = {}) {
  const started = deps.now?.() ?? new Date();
  const t0 = process.hrtime.bigint();
  const result = spawn(command, args, deps, extra);
  const ms = deps.durationMs ?? Number(process.hrtime.bigint() - t0) / 1e6;
  const raw = combined(result);
  const logPath = writeTaskLog(task, raw, deps, started);
  return { status: spawnStatus(result), raw, stdout: result.stdout ?? "", logPath, logDir: ensureLogDir(deps), ms, started };
}

function gitLines(args, deps) {
  const result = spawn("git", args, deps);
  return {
    status: spawnStatus(result),
    text: combined(result),
    stdout: result.stdout ?? "",
  };
}

function runNodeTest(args, deps) {
  const cwd = deps.cwd ?? process.cwd();
  const built = buildNodeTestArgv(args, { cwd, execPath: deps.execPath ?? process.execPath });
  if (built.error) {
    write(deps, `${built.error}\n`);
    return 2;
  }
  const logged = loggedSpawn("node-test", built.command, built.argv, deps);
  write(deps, formatNodeTestSummary({ ...logged, cwd }));
  return logged.status;
}

function runTest(args, deps) {
  const peeled = peelNodeTestArgs(args);
  if (peeled.nodeTest) return runNodeTest(peeled.rest, deps);
  const cwd = deps.cwd ?? process.cwd();
  const logged = loggedSpawn("test", "pnpm", buildTestArgv(args), deps);
  write(deps, formatTestSummary({ ...logged, cwd }));
  return logged.status;
}

function runTypecheck(args, deps) {
  const cwd = deps.cwd ?? process.cwd();
  const argv = buildTypecheckArgv(args);
  if (!argv) {
    write(deps, "typecheck: could not derive a package filter from those paths\n");
    return 2;
  }
  const logged = loggedSpawn("typecheck", "pnpm", argv, deps);
  write(deps, formatTypecheckSummary({ ...logged, cwd }));
  return logged.status;
}

function runLint(args, deps) {
  const cwd = deps.cwd ?? process.cwd();
  const logged = loggedSpawn("lint", "pnpm", buildLintArgv(args, cwd), deps);
  const parsed = looksLikeJson(logged.stdout) ? parseJson(logged.stdout) : undefined;
  const files = Array.isArray(parsed) ? parsed : [];
  write(deps, formatLintSummary(files, { ...logged, cwd }));
  return logged.status;
}

function runE2e(args, deps) {
  const cwd = deps.cwd ?? process.cwd();
  const started = deps.now?.() ?? new Date();
  const logDir = ensureLogDir(deps);
  const jsonPath = join(logDir, `${stamp(started, pidOf(deps))}-e2e.json`);
  const env = {
    ...process.env,
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath,
    ...deps.env,
  };
  const logged = loggedSpawn("e2e", "pnpm", buildE2eArgv(args), { ...deps, now: () => started }, { env });
  const json = existsSync(jsonPath) && looksLikeJson(readFileSync(jsonPath, "utf8"))
    ? parseJson(readFileSync(jsonPath, "utf8"))
    : looksLikeJson(logged.stdout)
      ? parseJson(logged.stdout)
      : undefined;
  write(
    deps,
    formatE2eSummary({
      raw: logged.raw,
      json,
      status: logged.status,
      ms: logged.ms,
      logPath: logged.logPath,
      jsonPath: existsSync(jsonPath) ? jsonPath : undefined,
      cwd,
    }),
  );
  return logged.status;
}

function diffBaseArgs(base) {
  return base ? [base] : [];
}

function rejectLeadingDash(task, args, deps) {
  const first = args[0];
  if (first?.startsWith("-")) {
    write(deps, `${task}: unexpected flag ${first}\n`);
    return true;
  }
  return false;
}

function runDiff(args, deps) {
  if (rejectLeadingDash("diff", args, deps)) return 2;
  const base = args[0];
  const names = gitLines(["diff", "--name-only", ...diffBaseArgs(base)], deps);
  const excluded = names.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(isExcludedDiffPath);
  const diff = gitLines(["diff", "-U1", ...diffBaseArgs(base), "--", ".", ...DIFF_EXCLUDES], deps);
  const raw = [names.text, diff.text].filter(Boolean).join("\n");
  const logPath = writeTaskLog("diff", raw, deps);
  write(deps, formatDiff(diff.stdout, { excluded, logPath }));
  return diff.status || names.status;
}

function runStatus(deps) {
  const porcelain = gitLines(["status", "--porcelain=v1", "-b"], deps);
  const stat = gitLines(["diff", "--stat"], deps);
  const status = porcelain.status || stat.status;
  if (status !== 0) {
    const raw = [porcelain.text, stat.text].filter(Boolean).join("\n");
    const logPath = writeTaskLog("status", raw, deps);
    write(deps, `${capLines(raw.trim() || "git status failed", 30)}\nLOG  ${logPath}\n`);
    return status;
  }
  write(deps, formatStatus({ porcelain: porcelain.stdout, stat: stat.stdout }));
  return 0;
}

function runPr(args, deps) {
  if (rejectLeadingDash("pr", args, deps)) return 2;
  const n = args[0] ? [args[0]] : [];
  const viewRes = spawn("gh", ["pr", "view", ...n, "--json", "state,url,mergeable,title,number"], deps);
  const checksRes = spawn("gh", ["pr", "checks", ...n, "--json", "name,state,bucket,link"], deps);
  if (spawnStatus(viewRes) !== 0 && !looksLikeJson(viewRes.stdout)) {
    write(deps, capLines(combined(viewRes).trim() || "gh pr view failed", 10));
    return spawnStatus(viewRes);
  }
  const view = looksLikeJson(viewRes.stdout) ? parseJson(viewRes.stdout) : undefined;
  const checks = looksLikeJson(checksRes.stdout) ? parseJson(checksRes.stdout) : undefined;
  if (spawnStatus(checksRes) !== 0 && !Array.isArray(checks)) {
    write(
      deps,
      formatPr({
        view,
        checksError: capLines(combined(checksRes).trim() || "gh pr checks failed", 10),
      }),
    );
    return spawnStatus(viewRes) || spawnStatus(checksRes);
  }
  write(deps, formatPr({ view, checks: Array.isArray(checks) ? checks : [] }));
  return spawnStatus(viewRes) || spawnStatus(checksRes);
}

export function run(argv, deps = {}) {
  const [task, ...args] = argv;
  if (!task) {
    write(deps, USAGE);
    return 2;
  }
  if (task === "-h" || task === "--help") {
    write(deps, USAGE);
    return 0;
  }
  if (!TASKS.includes(task)) {
    write(deps, `unknown task: ${task}\n${USAGE}`);
    return 2;
  }
  if (task === "test") return runTest(args, deps);
  if (task === "node-test") return runNodeTest(args, deps);
  if (task === "e2e") return runE2e(args, deps);
  if (task === "lint") return runLint(args, deps);
  if (task === "typecheck") return runTypecheck(args, deps);
  if (task === "diff") return runDiff(args, deps);
  if (task === "status") return runStatus(deps);
  return runPr(args, deps);
}

export function isMain(metaUrl = import.meta.url, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return metaUrl === pathToFileURL(resolve(argv1)).href;
}

if (isMain()) {
  process.exitCode = run(process.argv.slice(2));
}
