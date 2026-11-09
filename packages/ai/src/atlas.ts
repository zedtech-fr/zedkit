// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import type { Issue } from "./validate.js";

/** Above this the atlas stops being a lookup: merge rows or drop the ones one search finds. */
export const ATLAS_MAX_LINES = 150;
const MIN_WHERE_ROWS = 3;

const NOT_A_PATH = /[\s<>*{}$()]/u;

/**
 * An entry token is a path with two optional refinements:
 * `path` (exists), `path:line` (line in range; the number is indicative),
 * `path#symbol` (symbol still names something in the file),
 * `path#symbol#excerpt` (both still present). Split on `#` so an excerpt may
 * itself contain `:` or `#`.
 */
type EntryRef =
  | { kind: "path"; path: string }
  | { kind: "line"; path: string; start: number; end: number }
  | { kind: "anchor"; path: string; symbol: string; excerpt?: string };

/** Split one backticked cell token into a path, line, or anchor ref. */
function entryRef(token: string): EntryRef | undefined {
  const hash = token.indexOf("#");
  if (hash >= 0) {
    const path = token.slice(0, hash);
    const rest = token.slice(hash + 1);
    const second = rest.indexOf("#");
    const symbol = (second < 0 ? rest : rest.slice(0, second)).trim();
    const rawExcerpt = second < 0 ? "" : rest.slice(second + 1).trim();
    if (path === "" || symbol === "") return undefined;
    return rawExcerpt === "" ? { kind: "anchor", path, symbol } : { kind: "anchor", path, symbol, excerpt: rawExcerpt };
  }
  const line = token.match(/:(\d+)(?:-(\d+))?$/u);
  if (line) {
    const start = Number(line[1]);
    const end = line[2] === undefined ? start : Number(line[2]);
    return { kind: "line", path: token.slice(0, line.index), start, end };
  }
  return { kind: "path", path: token };
}

/** Whole-token hit count of a symbol or section title in file text. */
function symbolHits(text: string, symbol: string): number {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const hits = text.match(new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, "gu"));
  return hits === null ? 0 : hits.length;
}

/** Rows of the table under `## Where`, as cells; header and separator dropped. */
function whereRows(text: string): string[][] {
  const section = text.split(/^## /mu).find((s) => s.startsWith("Where")) ?? "";
  return section
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => c[0] !== "Topic" && !/^:?-{3,}:?$/u.test(c[0] ?? ""));
}

/** A token is path-like when it names a file or folder: no spaces, globs or placeholders, not a url or a package. */
function isPathLike(token: string): boolean {
  return token !== "" && !NOT_A_PATH.test(token) && !/^(@|-|https?:)/u.test(token) && /[./]/u.test(token);
}

/** Backticked tokens of a cell, parsed into path, line, or anchor refs. Anchor tokens may carry spaces in their excerpt. */
function entryRefs(cell: string): { token: string; ref: EntryRef }[] {
  const refs: { token: string; ref: EntryRef }[] = [];
  for (const match of cell.matchAll(/`([^`]+)`/gu)) {
    const token = match[1] ?? "";
    if (token.includes("#")) {
      const ref = entryRef(token);
      if (ref !== undefined && ref.kind === "anchor" && isPathLike(ref.path)) refs.push({ token, ref });
      continue;
    }
    if (!isPathLike(token.replace(/:\d+(-\d+)?$/u, ""))) continue;
    const ref = entryRef(token);
    if (ref !== undefined) refs.push({ token, ref });
  }
  return refs;
}

/**
 * The project atlas (`.agents/atlas.md`): a bounded lookup of where things live.
 * Every path in the Entry column of **Where** must exist, and the file stays under
 * a line cap. `required` (setup) also needs the file and a first real set of rows.
 */
export function checkAtlas(projectRoot: string, agentsDir: string, options: { required?: boolean } = {}): Issue[] {
  const path = join(agentsDir, "atlas.md");
  if (!existsSync(path)) {
    return options.required === true ? [{ path, message: "no atlas: copy the kit's atlas.template.md to .agents/atlas.md and fill Where and Run from the reading log" }] : [];
  }
  const raw = tryCatch(() => readFileSync(path, "utf8"));
  if (!raw.ok) return [{ path, message: `cannot read: ${raw.error.message}` }];
  const issues: Issue[] = [];
  const lines = raw.value.split("\n").length;
  if (lines > ATLAS_MAX_LINES) {
    issues.push({ path, message: `atlas has ${lines} lines (cap ${ATLAS_MAX_LINES}): merge rows, drop the ones a single search finds` });
  }
  const rows = whereRows(raw.value);
  for (const cells of rows) {
    for (const { token, ref } of entryRefs(cells[1] ?? "")) {
      const topic = cells[0] ?? "";
      if (!existsSync(join(projectRoot, ref.path))) {
        issues.push({ path, message: `stale row "${topic}": ${token} does not exist (fix the row or delete it)` });
        continue;
      }
      if (ref.kind === "path") continue;
      const text = tryCatch(() => readFileSync(join(projectRoot, ref.path), "utf8"));
      if (!text.ok) continue;
      if (ref.kind === "line") {
        const numbered = text.value.split(/\r?\n/u);
        if (numbered.length > 0 && numbered.at(-1) === "") numbered.pop();
        if (ref.start > numbered.length || ref.end > numbered.length) {
          issues.push({ path, message: `stale row "${topic}": ${token} points past the end of ${ref.path} (${numbered.length} lines)` });
          continue;
        }
        const target = (numbered[ref.start - 1] ?? "").trim();
        if (target === "" || (ref.path.endsWith(".md") && /^#{1,6}\s/u.test(target))) {
          issues.push({ path, message: `warning: row "${topic}": ${token} points at an indicative line in ${ref.path}; line numbers drift, resolve the anchor instead` });
        }
        continue;
      }
      const hits = symbolHits(text.value, ref.symbol);
      if (hits === 0) {
        issues.push({ path, message: `stale row "${topic}": symbol "${ref.symbol}" from ${token} not found in ${ref.path} (renamed or moved?)` });
        continue;
      }
      if (hits > 1) {
        issues.push({ path, message: `warning: row "${topic}": symbol "${ref.symbol}" from ${token} matches ${hits} lines in ${ref.path} — disambiguate with an excerpt` });
      }
      if (ref.excerpt !== undefined && !text.value.includes(ref.excerpt)) {
        issues.push({ path, message: `stale row "${topic}": excerpt from ${token} changed or moved in ${ref.path}` });
      }
    }
  }
  if (options.required === true && rows.length < MIN_WHERE_ROWS) {
    issues.push({ path, message: `atlas Where table has fewer than ${MIN_WHERE_ROWS} rows: fill it from the reading log's entry points and folder notes` });
  }
  return issues;
}
