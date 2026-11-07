// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import type { Issue } from "./validate.js";

/** Above this the atlas stops being a lookup: merge rows or drop the ones one search finds. */
export const ATLAS_MAX_LINES = 150;
const MIN_WHERE_ROWS = 3;

const NOT_A_PATH = /[\s<>*{}$()]/u;

/** Rows of the table under `## Where`, as cells; header and separator dropped. */
function whereRows(text: string): string[][] {
  const section = text.split(/^## /mu).find((s) => s.startsWith("Where")) ?? "";
  return section
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => c[0] !== "Topic" && !/^:?-{3,}:?$/u.test(c[0] ?? ""));
}

/** Backticked tokens of a cell that name a file or folder: no spaces, globs or placeholders, not a url or a package. */
function entryPaths(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/gu)]
    .map((m) => (m[1] ?? "").replace(/:\d+(-\d+)?$/u, ""))
    .filter((t) => t !== "" && !NOT_A_PATH.test(t) && !/^(@|-|https?:)/u.test(t) && /[./]/u.test(t));
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
    for (const entry of entryPaths(cells[1] ?? "")) {
      if (!existsSync(join(projectRoot, entry))) {
        issues.push({ path, message: `stale row "${cells[0] ?? ""}": ${entry} does not exist (fix the row or delete it)` });
      }
    }
  }
  if (options.required === true && rows.length < MIN_WHERE_ROWS) {
    issues.push({ path, message: `atlas Where table has fewer than ${MIN_WHERE_ROWS} rows: fill it from the reading log's entry points and folder notes` });
  }
  return issues;
}
