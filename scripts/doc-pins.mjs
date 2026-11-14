// Rewrite (and check) `@zedtech/zedkit-<pkg>@X.Y.Z` pins in a small
// explicit list of walkthroughs so the Version Packages PR does not
// need a hand-edited pin commit. `changeset:version` runs `write`;
// CI hygiene runs `check`.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, "..");

/** Walkthroughs whose pins must track the current package versions. */
export const PINNED_FILES = [
  "apps/docs/prose/guides/ai/setup.mdx",
  "apps/docs/public/ai/setup.md",
  "packages/ai/kit/cursor-onboarding.md",
  "apps/docs/prose/agent/ui-setup.md",
  "apps/docs/prose/agent/nest-setup.md",
  "apps/docs/prose/agent/map.md",
  "apps/docs/public/ui/setup.md",
  "apps/docs/public/nest/setup.md",
  "apps/docs/public/map.md",
];

const QUALIFIED_SOURCE = String.raw`@zedtech/zedkit-([a-z0-9-]+)@(\d+\.\d+\.\d+)`;

function qualifiedRe() {
  return new RegExp(QUALIFIED_SOURCE, "g");
}

const NAME = /^@zedtech\/zedkit-[a-z0-9-]+$/;
const VERSION = /^\d+\.\d+\.\d+$/;

function usage() {
  return "Usage: node scripts/doc-pins.mjs write|check [--root DIR]";
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = null;
  let root = DEFAULT_ROOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error(`${usage()}\nerror: --root needs a directory.`);
        process.exit(2);
      }
      root = resolve(value);
      i++;
    } else if ((args[i] === "write" || args[i] === "check") && !mode) {
      mode = args[i];
    } else {
      console.error(`${usage()}\nerror: unexpected argument "${args[i]}".`);
      process.exit(2);
    }
  }
  if (!mode) {
    console.error(`${usage()}\nerror: missing mode (write|check).`);
    process.exit(2);
  }
  return { mode, root };
}

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

/** Public `@zedtech/zedkit-*` versions from each packages/<name>/package.json. */
export function collectVersions(root) {
  const versions = new Map();
  const packages = join(root, "packages");
  if (!existsSync(packages)) return versions;
  for (const entry of readdirSync(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = join(packages, entry.name, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (pkg.private === true) continue;
    if (typeof pkg.name !== "string" || !NAME.test(pkg.name)) continue;
    if (typeof pkg.version !== "string" || !VERSION.test(pkg.version)) continue;
    versions.set(pkg.name, pkg.version);
  }
  return versions;
}

function qualifiedPins(text, versions) {
  const oldByPkg = new Map();
  for (const match of text.matchAll(qualifiedRe())) {
    const name = `@zedtech/zedkit-${match[1]}`;
    if (!versions.has(name)) continue;
    const olds = oldByPkg.get(name) ?? new Set();
    olds.add(match[2]);
    oldByPkg.set(name, olds);
  }
  return oldByPkg;
}

function replaceUnqualified(text, old, next) {
  const v = escapeRe(old);
  return text
    .replace(new RegExp(`\\*\\*${v}\\*\\*`, "g"), `**${next}**`)
    .replace(new RegExp(`\`@${v}\``, "g"), `\`@${next}\``)
    .replace(new RegExp(`\\^${v}(?!\\d)`, "g"), `^${next}`)
    .replace(new RegExp(`exactly at ${v}(?!\\d)`, "g"), `exactly at ${next}`);
}

/** Rewrite qualified pins and the walkthrough statements tied to them. */
export function rewritePins(text, versions) {
  let out = text;
  for (const [name, olds] of qualifiedPins(text, versions)) {
    const next = versions.get(name);
    for (const old of olds) {
      if (old === next) continue;
      out = out.replace(
        new RegExp(`${escapeRe(name)}@${escapeRe(old)}(?!\\d)`, "g"),
        `${name}@${next}`,
      );
      out = replaceUnqualified(out, old, next);
    }
  }
  return out;
}

function unqualifiedNeedles(old) {
  return [`**${old}**`, `\`@${old}\``, `^${old}`, `exactly at ${old}`];
}

/** Pin mismatches with 1-based file:line (qualified + tied unqualified). */
export function findMismatches(text, rel, versions) {
  const out = [];
  const seen = new Set();
  const push = (index, expected, actual) => {
    const key = `${index}:${expected}:${actual}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ rel, line: lineAt(text, index), expected, actual });
  };

  for (const match of text.matchAll(qualifiedRe())) {
    const name = `@zedtech/zedkit-${match[1]}`;
    const expected = versions.get(name);
    if (expected == null || match[2] === expected) continue;
    push(match.index ?? 0, expected, match[2]);
  }

  for (const [name, olds] of qualifiedPins(text, versions)) {
    const expected = versions.get(name);
    for (const old of olds) {
      if (old === expected) continue;
      for (const needle of unqualifiedNeedles(old)) {
        let from = 0;
        while (from < text.length) {
          const index = text.indexOf(needle, from);
          if (index < 0) break;
          push(index, expected, old);
          from = index + needle.length;
        }
      }
    }
  }
  return out;
}

function formatMismatch(item) {
  return `${item.rel}:${item.line}: expected ${item.expected}, actual ${item.actual}`;
}

function runWrite(root) {
  const versions = collectVersions(root);
  const errors = [];
  const pending = [];
  for (const rel of PINNED_FILES) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      errors.push(`${rel}: missing pinned file`);
      continue;
    }
    const text = readFileSync(path, "utf8");
    const next = rewritePins(text, versions);
    if (next !== text) pending.push({ path, next, rel });
  }
  if (errors.length > 0) return { ok: false, errors, wrote: [] };
  for (const item of pending) writeFileSync(item.path, item.next);
  return { ok: true, errors: [], wrote: pending.map((item) => item.rel) };
}

function runCheck(root) {
  const versions = collectVersions(root);
  const errors = [];
  for (const rel of PINNED_FILES) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      errors.push(`${rel}: missing pinned file`);
      continue;
    }
    const text = readFileSync(path, "utf8");
    for (const item of findMismatches(text, rel, versions)) {
      errors.push(formatMismatch(item));
    }
  }
  return { ok: errors.length === 0, errors };
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  const { mode, root } = parseArgs(process.argv);
  if (mode === "write") {
    const result = runWrite(root);
    if (!result.ok) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
    } else if (result.wrote.length > 0) {
      console.log(`doc-pins: wrote ${result.wrote.length} file${result.wrote.length === 1 ? "" : "s"}`);
    } else {
      console.log("doc-pins: ok (unchanged)");
    }
  }
  if (mode === "check") {
    const result = runCheck(root);
    if (!result.ok) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("ok");
    }
  }
}
