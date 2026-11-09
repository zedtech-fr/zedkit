// Scale-step class ban. Numbers belong in token values; class names name a role.
// The host names the roles. This module only rejects the default scale.
// Static limits (never claim more coverage than this): class sites are
// string literals inside className, cn(), cva() and @apply, including
// strings nested in template interpolations. Dynamically built names
// (`p-${n}`), classes held in variables or passed across files, and other
// helpers (clsx(), twMerge()) are NOT scanned.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";

const SPACING =
  /^(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|inset|inset-x|inset-y|top|right|bottom|left|start|end|basis)-(?:px|\d+(?:\.\d+)?)$/;
const FRACTION =
  /^(?:w|h|size|basis|inset|inset-x|inset-y|top|right|bottom|left|start|end)-\d+\/\d+$/;
const COUNT =
  /^(?:grid-cols|grid-rows|col-span|row-span|col-start|col-end|row-start|row-end)-\d+$/;
const TYPE = /^text-(?:xs|sm|base|lg|xl|[2-9]xl)$/;
const STACK_ROLES = new Set([
  "gap-stack-sm",
  "gap-stack-md",
  "gap-stack-lg",
  "gap-x-stack-sm",
  "gap-y-stack-sm",
  "gap-y-stack-md",
  "gap-y-stack-lg",
  "gap-x-stack-lg",
  "space-y-stack-sm",
  "space-y-stack-md",
  "space-y-stack-lg",
]);
const SPELLED = /(?:^|-)(?:zero|hairline)$|(?:^|-)stack-(?:3xs|2xs|xs|3h|\d+xl|sm|md|lg)$/;

/**
 * @param {string} className
 * @returns {"spacing" | "fraction" | "count" | "type" | "alias" | null}
 */
export function scaleClassKind(className) {
  let name = className.trim();
  if (name.endsWith("!")) name = name.slice(0, -1);
  const parts = name.split(":");
  name = parts[parts.length - 1] ?? "";
  if (name.startsWith("!")) name = name.slice(1);
  if (name.startsWith("-")) name = name.slice(1);
  if (SPACING.test(name)) return "spacing";
  if (FRACTION.test(name)) return "fraction";
  if (COUNT.test(name)) return "count";
  if (TYPE.test(name)) return "type";
  if (!STACK_ROLES.has(name) && SPELLED.test(name)) return "alias";
  return null;
}

/**
 * @param {string} token
 * @param {"spacing" | "fraction" | "count" | "type" | "alias"} kind
 */
export function scaleMessage(token, kind) {
  if (kind === "alias") {
    return `tokens-scale: "${token}" spells a scale step. Name the component role or layout job. A structural constraint stays a literal on that layout class, not a zero token.`;
  }
  return `tokens-scale: "${token}" is a ${kind} scale step. Name the component role or layout job. Put a shared design value in the token, not a spelled number in the class.`;
}

// Nesting beyond this is treated as unterminated: raw-text scans must
// never stack-overflow on adversarial `${`${…` input.
const MAX_NESTING = 64;

// Index of the closing quote for the string opening at `open`, or -1.
// Template literals nest: `${…}` may contain strings and templates.
function quoteEnd(source, open, limit = source.length, depth = 0) {
  if (depth > MAX_NESTING) return -1;
  const quote = source[open];
  let i = open + 1;
  while (i < limit) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return i;
    if (quote === "`" && ch === "$" && source[i + 1] === "{") {
      const close = balancedEnd(source, i + 1, "{", "}", limit, depth + 1);
      if (close === -1) return -1;
      i = close + 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

function balancedEnd(source, openIndex, openChar, closeChar, limit = source.length, nestDepth = 0) {
  let depth = 0;
  for (let i = openIndex; i < limit; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const end = quoteEnd(source, i, limit, nestDepth);
      if (end === -1) return -1;
      i = end;
      continue;
    }
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * @param {string} literal
 * @param {number} literalStart
 * @param {{ token: string, kind: string, index: number }[]} hits
 * @param {Set<number>} seen
 */
function addClasses(literal, literalStart, hits, seen, depth = 0) {
  if (depth > MAX_NESTING) return;
  let i = 0;
  while (i < literal.length) {
    if (literal.startsWith("${", i)) {
      // Strings inside ${…} are class sites too (conditional classes).
      const close = balancedEnd(literal, i + 1, "{", "}");
      const innerEnd = close === -1 ? literal.length : close;
      stringsIn(literal, i + 2, innerEnd, hits, seen, literalStart, depth + 1);
      i = close === -1 ? literal.length : close + 1;
      continue;
    }
    const ch = literal[i] ?? "";
    if (ch === "" || /\s/u.test(ch)) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < literal.length && !/\s/u.test(literal[j] ?? "") && !literal.startsWith("${", j)) j += 1;
    const token = literal.slice(i, j);
    const kind = scaleClassKind(token);
    if (kind && !seen.has(literalStart + i)) {
      seen.add(literalStart + i);
      hits.push({ token, kind, index: literalStart + i });
    }
    i = j;
  }
}

/**
 * @param {string} source
 * @param {number} start
 * @param {number} end
 * @param {{ token: string, kind: string, index: number }[]} hits
 * @param {Set<number>} seen
 */
function stringsIn(source, start, end, hits, seen, base = 0, depth = 0) {
  for (let i = start; i < end; i++) {
    const ch = source[i];
    if (ch !== '"' && ch !== "'" && ch !== "`") continue;
    const close = quoteEnd(source, i, end);
    if (close === -1) {
      // Unterminated literal (raw-text scans): still scan what is there.
      addClasses(source.slice(i + 1, end), base + i + 1, hits, seen, depth);
      return;
    }
    addClasses(source.slice(i + 1, close), base + i + 1, hits, seen, depth);
    i = close;
  }
}

/**
 * Scale classes inside className, cn(), cva() and @apply.
 * The same token reached twice counts once.
 *
 * @param {string} source
 * @returns {{ token: string, kind: string, index: number }[]}
 */
export function findScaleHits(source) {
  const hits = [];
  const seen = new Set();
  // Single-pass discipline: the cursor never re-enters a consumed region,
  // and an unbalanced construct terminates its region at EOF exactly once.
  // Without this, stray-quote / nested-call inputs rescan quadratically.
  const attr = /className\s*=\s*/g;
  let match = attr.exec(source);
  while (match) {
    const i = match.index + match[0].length;
    const ch = source[i];
    if (ch === "{") {
      const end = balancedEnd(source, i, "{", "}");
      if (end === -1) {
        stringsIn(source, i, source.length, hits, seen);
        break;
      }
      stringsIn(source, i, end, hits, seen);
      attr.lastIndex = Math.max(attr.lastIndex, end);
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const end = quoteEnd(source, i);
      if (end === -1) {
        addClasses(source.slice(i + 1), i + 1, hits, seen);
        break;
      }
      addClasses(source.slice(i + 1, end), i + 1, hits, seen);
      attr.lastIndex = Math.max(attr.lastIndex, end);
    }
    match = attr.exec(source);
  }
  const calls = /\b(?:cn|cva)\s*\(/g;
  match = calls.exec(source);
  while (match) {
    const open = match.index + match[0].length - 1;
    const end = balancedEnd(source, open, "(", ")");
    if (end === -1) {
      stringsIn(source, open, source.length, hits, seen);
      break;
    }
    stringsIn(source, open, end, hits, seen);
    calls.lastIndex = Math.max(calls.lastIndex, end);
    match = calls.exec(source);
  }
  const apply = /@apply\s+([^;]+);/g;
  match = apply.exec(source);
  while (match) {
    const body = match[1] ?? "";
    const at = match.index + match[0].indexOf(body);
    addClasses(body, at, hits, seen);
    match = apply.exec(source);
  }
  return hits;
}

/**
 * @param {string} cwd
 */
function tailwindInTree(start) {
  return tailwindPackageRoot(start) !== null;
}

/** Directory whose node_modules contains tailwindcss, walking up from `start`. */
export function tailwindPackageRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "node_modules", "tailwindcss", "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const ESLINT_CONFIGS = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", "eslint.config.mts"];

/**
 * Resolve a CSS entryPoint once to an absolute path. A relative entry is
 * resolved against the nearest ancestor that holds an ESLint flat config
 * and the file (so linting from a subdirectory matches linting from the
 * root); falls back to the given cwd. Absolute paths pass through.
 *
 * @param {string} entryPoint
 * @param {string} cwd
 * @returns {string}
 */
export function resolveEntryPoint(entryPoint, cwd) {
  if (typeof entryPoint !== "string" || entryPoint === "" || isAbsolute(entryPoint)) return entryPoint;
  let dir = cwd;
  for (let i = 0; i < 16; i += 1) {
    const candidate = join(dir, entryPoint);
    if (existsSync(candidate) && ESLINT_CONFIGS.some((name) => existsSync(join(dir, name)))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(cwd, entryPoint);
}

/**
 * Per-file increases of `current` over `committed` (new files count from 0).
 * The baseline ratchet: `--write` may only record decreases.
 *
 * @param {Map<string, number>} committed
 * @param {Map<string, number>} current
 * @returns {string[]}
 */
export function baselineIncreases(committed, current) {
  const out = [];
  for (const key of [...current.keys()].sort()) {
    const now = current.get(key) ?? 0;
    const was = committed.get(key) ?? 0;
    if (now > was) out.push(`${key}: baseline ${was}, current ${now}`);
  }
  return out;
}

export function tailwindResolvable(cwd, entryPoint) {
  // One criterion, shared with the preset's better-tailwindcss `cwd`:
  // tailwindcss must sit in a node_modules reachable by walking up from
  // the CSS entry directory or the lint cwd. (A looser resolve.paths probe
  // here previously let `tailwind-ready` pass while the plugin disabled
  // its theme rules.)
  if (tailwindInTree(cwd)) return true;
  if (typeof entryPoint === "string" && entryPoint !== "") {
    const entry = resolveEntryPoint(entryPoint, cwd);
    if (tailwindInTree(dirname(entry))) return true;
  }
  return false;
}

/**
 * @param {string} cwd
 * @param {string} entryPoint
 * @returns {string | null}
 */
export function tailwindProblem(cwd, entryPoint) {
  if (typeof entryPoint !== "string" || entryPoint === "") {
    return "tokens-tailwind: entryPoint is empty, so theme checks cannot start. This check fails closed.";
  }
  const entry = resolveEntryPoint(entryPoint, cwd);
  if (!existsSync(entry)) {
    return `tokens-tailwind: Tailwind entry not found at ${entry}. Theme checks would fall back to default classes and miss host tokens. Pass the CSS entry that defines the theme. This check fails closed.`;
  }
  if (!tailwindResolvable(cwd, entryPoint)) {
    return `tokens-tailwind: Tailwind CSS is not resolvable from ${cwd}. Theme checks did not start. Install tailwindcss where ESLint runs. This check fails closed.`;
  }
  return null;
}

/**
 * @param {string | undefined} file
 * @returns {{ files: Map<string, number>, error: string | null }}
 */
export function readScaleBaseline(file) {
  if (!file) return { files: new Map(), error: null };
  if (!existsSync(file)) {
    return {
      files: new Map(),
      error: `tokens-scale: baseline not found at ${file}. This check fails closed.`,
    };
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!data || typeof data !== "object" || !data.files || typeof data.files !== "object") {
    return {
      files: new Map(),
      error: `tokens-scale: baseline at ${file} needs a files object. This check fails closed.`,
    };
  }
  const files = new Map();
  for (const [key, value] of Object.entries(data.files)) {
    if (!Number.isInteger(value) || value < 0) {
      return {
        files: new Map(),
        error: `tokens-scale: baseline count for ${key} must be a non-negative integer. This check fails closed.`,
      };
    }
    files.set(key.split("\\").join("/"), value);
  }
  return { files, error: null };
}

/**
 * @param {string} cwd
 * @param {string} filename
 */
export function scaleBaselineKey(cwd, filename) {
  return relative(cwd, filename).split("\\").join("/");
}

const baselineCache = new Map();

function baselineFor(file) {
  if (!file) return { files: new Map(), error: null };
  const cached = baselineCache.get(file);
  if (cached) return cached;
  const loaded = readScaleBaseline(file);
  baselineCache.set(file, loaded);
  return loaded;
}

/**
 * Flat-config plugin. `tailwind-ready` fails when Tailwind or the CSS entry
 * cannot be resolved. `no-scale-classes` rejects scale steps; a baseline
 * file may allow a per-file count that only shrinks (the check script).
 *
 * @param {string} entryPoint
 * @param {string | undefined} scaleBaseline
 */
export function zedkitLintPlugin(entryPoint, scaleBaseline) {
  return {
    rules: {
      "tailwind-ready": {
        meta: {
          type: "problem",
          docs: { description: "Fail when Tailwind or its CSS entry cannot be resolved." },
          schema: [],
        },
        create(context) {
          return {
            Program(node) {
              const configured = context.settings?.zedkit?.entryPoint;
              const effective = typeof configured === "string" && configured !== "" ? configured : entryPoint;
              const problem = tailwindProblem(context.cwd, effective);
              if (!problem) return;
              context.report({ node, message: problem });
            },
          };
        },
      },
      "no-scale-classes": {
        meta: {
          type: "problem",
          docs: { description: "Disallow numeric and default type-scale classes." },
          schema: [],
        },
        create(context) {
          const loaded = baselineFor(scaleBaseline);
          return {
            Program(node) {
              if (loaded.error) {
                context.report({ node, message: loaded.error });
                return;
              }
              const source = context.sourceCode;
              const hits = findScaleHits(source.getText());
              const allowance = loaded.files.get(scaleBaselineKey(context.cwd, context.filename)) ?? 0;
              if (hits.length <= allowance) return;
              if (allowance === 0) {
                for (const hit of hits) {
                  context.report({
                    loc: source.getLocFromIndex(hit.index),
                    message: scaleMessage(hit.token, hit.kind),
                  });
                }
                return;
              }
              const hit = hits[allowance];
              context.report({
                loc: source.getLocFromIndex(hit.index),
                message: `tokens-scale: ${hits.length} scale classes in this file; the baseline allows ${allowance}. Remove a numeric, spelled, or type-scale class. Name the role or layout job. The baseline only shrinks.`,
              });
            },
          };
        },
      },
    },
  };
}
