// Original work by the same author.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import type { Issue } from "./validate.js";

/** Above this the atlas stops being a lookup: merge rows or drop the ones one search finds. */
export const ATLAS_MAX_LINES = 150;
/**
 * Soft byte cap on `.agents/atlas.md`. Over it is `warning:` (validate exit 0)
 * so a fat consumer atlas does not fail on upgrade. This repo stays under it.
 */
export const ATLAS_MAX_BYTES = 24_000;
/**
 * Soft cap on a Where table data row in `.agents/atlas.md` (characters).
 * Over it is `warning:`. Long traps belong in `.agents/atlas/<topic>.md`.
 */
export const ATLAS_MAX_ROW_CHARS = 280;
const MIN_WHERE_ROWS = 3;

/** Spaces, globs, and placeholder markup. Next.js `(group)` / `_private` segments are real paths. */
const NOT_A_PATH = /[\s<>*{}$]/u;

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

/**
 * An excerpt belongs to a symbol hit when it sits with it: on the hit's own
 * line, inside the hit's own declaration body (a same-line or forward `{`
 * reached without crossing other code), inside the brace block enclosing a
 * braceless hit (either side of it), within the hit heading's Markdown
 * section, or in the contiguous comment lines directly above it (leading
 * trivia such as a docstring).
 * Insertions move symbol and excerpt together, so silent re-resolution still
 * holds; an excerpt living in a sibling function, method, or section breaks
 * every rule, and the anchor is reported instead of silently passing.
 * Brace counting is single-line and naive (strings and `//` comments are
 * stripped; escaped quotes are honored, multi-line strings are not) — good
 * enough for a checker, never a parser.
 */
function stripLineForBraces(line: string): string {
  let out = "";
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i++;
      while (i < line.length && line[i] !== ch) i += line[i] === "\\" ? 2 : 1;
      i++;
    } else if (ch === "/" && line[i + 1] === "/") {
      break;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** A comment-only line: the only lines leading trivia may cross (blanks end it). */
function isTriviaLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("*/") ||
    trimmed.startsWith("<!--")
  );
}

/** Line indices where a symbol or section title occurs as a whole token. */
function symbolHitLines(numbered: string[], symbol: string): number[] {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const hit = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, "u");
  return numbered.map((line, i) => (hit.test(line) ? i : -1)).filter((i) => i >= 0);
}

/** First line of the block enclosing the hit: the nearest unmatched `{` at or above it. */
function blockOpen(numbered: string[], hitLine: number): number | undefined {
  let depth = 0;
  for (let i = hitLine; i >= 0; i--) {
    const stripped = stripLineForBraces(numbered[i] ?? "");
    for (let k = stripped.length - 1; k >= 0; k--) {
      const ch = stripped[k];
      if (ch === "}") depth++;
      else if (ch === "{") depth--;
    }
    if (depth < 0) return i;
  }
  return undefined;
}

/** ATX heading level of a line, if it is one (`## Title` → 2). */
function headingLevel(line: string): number | undefined {
  const match = /^(#{1,6})(?:\s|$)/u.exec(line.trim());
  if (match === null) return undefined;
  return (match[1] ?? "").length;
}

/**
 * Last line of the Markdown section opened by a heading hit: the line before
 * the next heading of equal or higher level, or the end of the file. Only
 * for Markdown targets hit on a heading line; anything else is not a section.
 */
function sectionEnd(numbered: string[], hitLine: number, refPath: string): number | undefined {
  if (!/\.(md|mdx|markdown)$/u.test(refPath)) return undefined;
  const level = headingLevel(numbered[hitLine] ?? "");
  if (level === undefined) return undefined;
  for (let i = hitLine + 1; i < numbered.length; i++) {
    const next = headingLevel(numbered[i] ?? "");
    if (next !== undefined && next <= level) return i - 1;
  }
  return numbered.length - 1;
}

/**
 * First line of the `{`-body opened by the declaration starting at the hit
 * line: a same-line brace, or a forward brace reached through the header's
 * own parenthesized lines plus an Allman-style `{` line separated from the
 * header only by blanks and trivia. Any other code in between (another
 * declaration, a call, a statement end) means the hit opens no body here.
 */
function declBodyOpen(numbered: string[], hitLine: number): number | undefined {
  let parens = 0;
  let sawParen = false;
  let h = hitLine;
  let i = hitLine;
  for (; i < numbered.length; i++) {
    const stripped = stripLineForBraces(numbered[i] ?? "");
    for (const ch of stripped) {
      if (ch === "(") {
        parens++;
        sawParen = true;
      } else if (ch === ")") {
        parens = Math.max(0, parens - 1);
      } else if (ch === "{" && parens === 0) {
        return i;
      } else if ((ch === "}" || ch === ";") && parens === 0) {
        return undefined;
      }
    }
    if (parens === 0) {
      h = i;
      break;
    }
  }
  if (!sawParen) return undefined;
  for (let j = h + 1; j < numbered.length; j++) {
    const line = numbered[j] ?? "";
    if (line.trim() === "" || isTriviaLine(line)) continue;
    return stripLineForBraces(line).trimStart().startsWith("{") ? j : undefined;
  }
  return undefined;
}

/** Last line of the brace block opened on (or after) the hit line; the hit line itself when it opens none. */
function blockClose(numbered: string[], hitLine: number): number {
  let depth = 0;
  for (let i = hitLine; i < numbered.length; i++) {
    const stripped = stripLineForBraces(numbered[i] ?? "");
    for (const ch of stripped) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth <= 0) return i;
  }
  return numbered.length - 1;
}

/**
 * Whether the excerpt sits with the symbol hit: its line, its heading's
 * section, its declaration's own body, its enclosing block, or its leading
 * comments. A hit that opens a multi-line block owns that block forward and
 * never reaches upward; a method's balanced one-line body never broadens to
 * its class.
 */
function excerptBelongs(numbered: string[], hitLine: number, excerpt: string, refPath: string): boolean {
  if ((numbered[hitLine] ?? "").includes(excerpt)) return true;
  const section = sectionEnd(numbered, hitLine, refPath);
  if (section !== undefined) {
    for (let i = hitLine; i <= section; i++) {
      if ((numbered[i] ?? "").includes(excerpt)) return true;
    }
  } else if (blockClose(numbered, hitLine) > hitLine) {
    const close = blockClose(numbered, hitLine);
    for (let i = hitLine; i <= close; i++) {
      if ((numbered[i] ?? "").includes(excerpt)) return true;
    }
  } else {
    const body = declBodyOpen(numbered, hitLine);
    const open = body ?? blockOpen(numbered, hitLine) ?? hitLine;
    const close = blockClose(numbered, open);
    // A found body owns its header lines too (an excerpt may name a parameter).
    const from = body === undefined ? open : hitLine;
    for (let i = from; i <= close; i++) {
      if ((numbered[i] ?? "").includes(excerpt)) return true;
    }
  }
  for (let i = hitLine - 1; i >= 0; i--) {
    const line = numbered[i] ?? "";
    if (line.trim() === "" || !isTriviaLine(line)) break;
    if (line.includes(excerpt)) return true;
  }
  return false;
}

/** Split a table row on unescaped pipes; `\\|` stays a literal pipe inside a cell. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\\" && line[i + 1] === "|") {
      current += "|";
      i++;
    } else if (ch === "|") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/** Data rows of the Where table, as source lines (header and separator dropped). */
function whereDataLines(text: string): string[] {
  const section = text.split(/^## /mu).find((s) => s.startsWith("Where")) ?? "";
  return section.split("\n").filter((line) => {
    if (!line.startsWith("|")) return false;
    const topic = splitRow(line).slice(1, -1)[0]?.trim() ?? "";
    return topic !== "Topic" && !/^:?-{3,}:?$/u.test(topic);
  });
}

/** Rows of the table under `## Where`, as cells; header and separator dropped. */
function whereRows(text: string): string[][] {
  return whereDataLines(text).map((line) => splitRow(line).slice(1, -1).map((c) => c.trim()));
}

/** A token is path-like when it names a file or folder: no spaces, globs or placeholder markup, not a url or a package. */
function isPathLike(token: string): boolean {
  return token !== "" && !NOT_A_PATH.test(token) && !/^(@|-|https?:)/u.test(token) && /[./]/u.test(token);
}

/**
 * Backticked tokens of a cell, parsed into path, line, or anchor refs. Anchor
 * tokens may carry spaces in their excerpt. A `#` token that parses to nothing
 * usable is malformed — unless its head has spaces (prose, not a ref attempt).
 */
function entryRefs(cell: string): { token: string; ref: EntryRef | undefined; malformed: boolean }[] {
  const refs: { token: string; ref: EntryRef | undefined; malformed: boolean }[] = [];
  for (const match of cell.matchAll(/`([^`]+)`/gu)) {
    const token = match[1] ?? "";
    if (token.includes("#")) {
      const ref = entryRef(token);
      if (ref !== undefined && ref.kind === "anchor" && isPathLike(ref.path)) {
        refs.push({ token, ref, malformed: false });
      } else if (!/\s/u.test(token.slice(0, token.indexOf("#")))) {
        refs.push({ token, ref: undefined, malformed: true });
      }
      continue;
    }
    if (!isPathLike(token.replace(/:\d+(-\d+)?$/u, ""))) continue;
    const ref = entryRef(token);
    if (ref !== undefined) refs.push({ token, ref, malformed: false });
  }
  return refs;
}

/** A linked `.agents/atlas/<topic>.md` file, not the index itself. */
function atlasTopicAbs(projectRoot: string, agentsDir: string, rel: string): string | undefined {
  const abs = join(projectRoot, rel);
  if (dirname(abs) !== join(agentsDir, "atlas")) return undefined;
  if (!rel.endsWith(".md")) return undefined;
  return abs;
}

/**
 * Every path in the Entry column of **Where** must exist. Linked topic files
 * under `.agents/atlas/` are followed so extracted traps keep the same check.
 */
function checkWhereTable(
  projectRoot: string,
  agentsDir: string,
  reportPath: string,
  text: string,
  issues: Issue[],
  seen: Set<string>,
): void {
  for (const cells of whereRows(text)) {
    const topic = cells[0] ?? "";
    for (const { token, ref, malformed } of entryRefs(cells[1] ?? "")) {
      if (malformed || ref === undefined) {
        issues.push({ path: reportPath, message: `stale row "${topic}": ${token} is not a valid anchor (expected path#Symbol[#excerpt])` });
        continue;
      }
      if (!existsSync(join(projectRoot, ref.path))) {
        issues.push({ path: reportPath, message: `stale row "${topic}": ${token} does not exist (fix the row or delete it)` });
        continue;
      }
      const topicFile = atlasTopicAbs(projectRoot, agentsDir, ref.path);
      if (topicFile !== undefined && !seen.has(topicFile)) {
        seen.add(topicFile);
        const nested = tryCatch(() => readFileSync(topicFile, "utf8"));
        if (nested.ok) {
          checkWhereTable(projectRoot, agentsDir, topicFile, nested.value, issues, seen);
        } else {
          issues.push({
            path: reportPath,
            message: `stale row "${topic}": ${token} cannot be read from ${ref.path}; reference left unresolved`,
          });
        }
      }
      if (ref.kind === "path") continue;
      const body = tryCatch(() => readFileSync(join(projectRoot, ref.path), "utf8"));
      if (!body.ok) {
        const st = tryCatch(() => statSync(join(projectRoot, ref.path)));
        if (st.ok && st.value.isDirectory()) {
          issues.push({ path: reportPath, message: `stale row "${topic}": ${token} points at a directory (${ref.path}); anchors need a file` });
        } else {
          issues.push({ path: reportPath, message: `stale row "${topic}": ${token} cannot be read from ${ref.path}; reference left unresolved` });
        }
        continue;
      }
      const numbered = body.value.split(/\r?\n/u);
      if (numbered.length > 0 && numbered.at(-1) === "") numbered.pop();
      if (ref.kind === "line") {
        if (ref.start > numbered.length || ref.end > numbered.length) {
          issues.push({ path: reportPath, message: `stale row "${topic}": ${token} points past the end of ${ref.path} (${numbered.length} lines)` });
          continue;
        }
        const target = (numbered[ref.start - 1] ?? "").trim();
        if (target === "" || (ref.path.endsWith(".md") && /^#{1,6}\s/u.test(target))) {
          issues.push({ path: reportPath, message: `warning: row "${topic}": ${token} points at an indicative line in ${ref.path}; line numbers drift, resolve the anchor instead` });
        }
        continue;
      }
      const hitLines = symbolHitLines(numbered, ref.symbol);
      if (hitLines.length === 0) {
        issues.push({ path: reportPath, message: `stale row "${topic}": symbol "${ref.symbol}" from ${token} not found in ${ref.path}` });
        continue;
      }
      const excerpt = ref.excerpt;
      if (excerpt === undefined) {
        if (hitLines.length > 1) {
          issues.push({ path: reportPath, message: `warning: row "${topic}": symbol "${ref.symbol}" from ${token} matches ${hitLines.length} lines in ${ref.path} — disambiguate with an excerpt` });
        }
        continue;
      }
      const candidates = hitLines.filter((h) => excerptBelongs(numbered, h, excerpt, ref.path));
      if (candidates.length === 1) continue;
      if (candidates.length === 0) {
        issues.push({ path: reportPath, message: `stale row "${topic}": excerpt from ${token} has no symbol hit sitting with it in ${ref.path}` });
        continue;
      }
      issues.push({ path: reportPath, message: `warning: row "${topic}": excerpt from ${token} sits with ${candidates.length} symbol hits in ${ref.path} — reference left ambiguous` });
    }
  }
}

/**
 * The project atlas (`.agents/atlas.md`): a bounded lookup of where things live.
 * Every path in the Entry column of **Where** must exist, and the file stays under
 * a line cap. Byte size and row length over the soft caps warn (validate exit 0).
 * `required` (setup) also needs the file and a first real set of rows.
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
  const bytes = Buffer.byteLength(raw.value, "utf8");
  if (bytes > ATLAS_MAX_BYTES) {
    issues.push({
      path,
      message: `warning: atlas is ${bytes} bytes (soft cap ${ATLAS_MAX_BYTES}): shrink the index file, or move Where traps into .agents/atlas/<topic>.md`,
    });
  }
  for (const line of whereDataLines(raw.value)) {
    const chars = [...line].length;
    if (chars <= ATLAS_MAX_ROW_CHARS) continue;
    const topic = splitRow(line).slice(1, -1)[0]?.trim() ?? "";
    issues.push({
      path,
      message: `warning: row "${topic}" is ${chars} characters (soft cap ${ATLAS_MAX_ROW_CHARS}): move detail to .agents/atlas/<topic>.md and point Entry at that file`,
    });
  }
  const seen = new Set<string>([path]);
  checkWhereTable(projectRoot, agentsDir, path, raw.value, issues, seen);
  if (options.required === true && whereRows(raw.value).length < MIN_WHERE_ROWS) {
    issues.push({ path, message: `atlas Where table has fewer than ${MIN_WHERE_ROWS} rows: fill it from the reading log's entry points and folder notes` });
  }
  return issues;
}
