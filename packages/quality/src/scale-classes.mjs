// Scale-step class ban. Numbers belong in token values; class names name a role.
// The host names the roles. This module only rejects the default scale.
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

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

function quoteEnd(source, open) {
  const quote = source[open];
  for (let i = open + 1; i < source.length; i++) {
    if (source[i] === "\\") {
      i += 1;
      continue;
    }
    if (source[i] === quote) return i;
  }
  return -1;
}

function balancedEnd(source, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = "";
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
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
function addClasses(literal, literalStart, hits, seen) {
  let i = 0;
  while (i < literal.length) {
    if (literal.startsWith("${", i)) {
      const close = literal.indexOf("}", i + 2);
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
function stringsIn(source, start, end, hits, seen) {
  let quote = "";
  let literalStart = -1;
  for (let i = start; i < end; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) {
        addClasses(source.slice(literalStart, i), literalStart, hits, seen);
        quote = "";
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      literalStart = i + 1;
    }
  }
}

/**
 * Scale classes inside className, cn(), cva() and @apply.
 * The same token reached twice (className={cn("p-4")}) counts once.
 *
 * @param {string} source
 * @returns {{ token: string, kind: string, index: number }[]}
 */
export function findScaleHits(source) {
  const hits = [];
  const seen = new Set();
  const attr = /className\s*=\s*/g;
  let match = attr.exec(source);
  while (match) {
    const i = match.index + match[0].length;
    const ch = source[i];
    if (ch === "{") {
      const end = balancedEnd(source, i, "{", "}");
      if (end !== -1) stringsIn(source, i, end, hits, seen);
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const end = quoteEnd(source, i);
      if (end !== -1) addClasses(source.slice(i + 1, end), i + 1, hits, seen);
    }
    match = attr.exec(source);
  }
  const calls = /\b(?:cn|cva)\s*\(/g;
  match = calls.exec(source);
  while (match) {
    const open = match.index + match[0].length - 1;
    const end = balancedEnd(source, open, "(", ")");
    if (end !== -1) stringsIn(source, open, end, hits, seen);
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

export function tailwindResolvable(cwd, entryPoint) {
  if (tailwindInTree(cwd)) return true;
  if (typeof entryPoint === "string" && entryPoint !== "") {
    const entry = isAbsolute(entryPoint) ? entryPoint : join(cwd, entryPoint);
    if (tailwindInTree(dirname(entry))) return true;
  }
  const req = createRequire(pathToFileURL(join(cwd, "package.json")).href);
  const paths = req.resolve.paths("tailwindcss/package.json");
  if (!paths) return false;
  return paths.some((dir) => existsSync(join(dir, "tailwindcss", "package.json")));
}

/**
 * @param {string} cwd
 * @param {string} entryPoint
 * @returns {string | null}
 */
export function tailwindProblem(cwd, entryPoint) {
  if (!tailwindResolvable(cwd, entryPoint)) {
    return `tokens-tailwind: Tailwind CSS is not resolvable from ${cwd}. Theme checks did not start. Install tailwindcss where ESLint runs. This check fails closed.`;
  }
  if (typeof entryPoint !== "string" || entryPoint === "") {
    return "tokens-tailwind: entryPoint is empty, so theme checks cannot start. This check fails closed.";
  }
  const entry = isAbsolute(entryPoint) ? entryPoint : join(cwd, entryPoint);
  if (!existsSync(entry)) {
    return `tokens-tailwind: Tailwind entry not found at ${entry}. Theme checks would fall back to default classes and miss host tokens. Pass the CSS entry that defines the theme. This check fails closed.`;
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
              const problem = tailwindProblem(context.cwd, entryPoint);
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
