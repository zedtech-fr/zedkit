#!/usr/bin/env node
// Changeset gate for API reports vs origin/main.
// Catch-up (no extra bump) only when HEAD's report is origin/main's report
// plus complete public declarations that already exist, equivalently, in
// origin/main's source. Equivalence uses TypeScript's parser (not the
// checker): unsupported syntax has no shape and fails closed.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const NAME_RE = /^["']([^"']+)["']\s*:\s*(patch|minor|major)/;
const DECL_HEADER_RE =
  /^export\s+(?:declare\s+)?(?:async\s+)?(function|class|interface|type|enum|const|let|var|namespace)\s+([A-Za-z_$][\w$]*)/u;
const SOURCE_CANDIDATES = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".d.ts",
  ".d.mts",
  ".d.cts",
  ".js",
];

/**
 * @param {string} report
 * @returns {string}
 */
export function reportTsBody(report) {
  const fence = /```ts\n([\s\S]*?)\n```/u.exec(report);
  return fence ? fence[1] : report;
}

/**
 * @param {string} text
 * @returns {string | null}
 */
export function declKind(text) {
  const match = DECL_HEADER_RE.exec(text.trim());
  return match ? match[1] : null;
}

/**
 * @param {string} body
 * @returns {Map<string, string>}
 */
export function parseReportDeclarations(body) {
  const decls = new Map();
  const text = reportTsBody(body);
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = DECL_HEADER_RE.exec(lines[i]);
    if (!match) continue;
    const end = consumeBlockLines(lines, i);
    const block = lines.slice(i, end).join("\n");
    const prev = decls.get(match[2]);
    decls.set(match[2], prev ? `${prev}\n${block}` : block);
    i = end - 1;
  }
  return decls;
}

/**
 * @param {string[]} lines
 * @param {number} start
 */
function consumeBlockLines(lines, start) {
  let brace = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "{") {
        brace += 1;
        started = true;
      } else if (ch === "}") brace -= 1;
    }
    if (started && brace <= 0) return i + 1;
    if (!started && /;\s*$/u.test(line) && !line.includes("{")) return i + 1;
  }
  return lines.length;
}

function compactWs(text) {
  return text.replace(/\s+/gu, " ").trim();
}

function parseTs(text, path = "decl.ts") {
  return ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function isExported(stmt) {
  return (ts.getCombinedModifierFlags(stmt) & ts.ModifierFlags.Export) !== 0;
}

function typeParamsOf(node, sf) {
  return (node.typeParameters ?? []).map((tp) => ({
    name: tp.name.getText(sf),
    constraint: tp.constraint ? compactWs(tp.constraint.getText(sf)) : "",
    default: tp.default ? compactWs(tp.default.getText(sf)) : "",
  }));
}

function heritageOf(node, sf) {
  return (node.heritageClauses ?? []).flatMap((clause) => {
    const tag = clause.token === ts.SyntaxKind.ExtendsKeyword ? "extends" : "implements";
    return clause.types.map((type) => `${tag} ${compactWs(type.getText(sf))}`);
  });
}

/**
 * shortcut: shapes cover function/interface/class/type/const. Other syntax
 * returns null so catch-up fails closed until a changeset exists.
 * @param {ts.Statement} stmt
 * @param {ts.SourceFile} sf
 */
function nodeShape(stmt, sf) {
  if (ts.isFunctionDeclaration(stmt)) {
    return {
      kind: "function",
      typeParams: typeParamsOf(stmt, sf),
      params: stmt.parameters.map((param) => compactWs(param.getText(sf))),
      returnType: stmt.type ? compactWs(stmt.type.getText(sf)) : "",
    };
  }
  if (ts.isInterfaceDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
    return {
      kind: ts.isClassDeclaration(stmt) ? "class" : "interface",
      typeParams: typeParamsOf(stmt, sf),
      heritage: heritageOf(stmt, sf),
      members: stmt.members.map((member) => compactWs(member.getText(sf).replace(/;$/u, ""))).sort(),
    };
  }
  if (ts.isTypeAliasDeclaration(stmt)) {
    return {
      kind: "type",
      typeParams: typeParamsOf(stmt, sf),
      type: compactWs(stmt.type.getText(sf)),
    };
  }
  if (ts.isVariableStatement(stmt)) {
    const decl = stmt.declarationList.declarations[0];
    if (!decl || !ts.isIdentifier(decl.name)) return null;
    return {
      kind: "const",
      type: decl.type ? compactWs(decl.type.getText(sf)) : "",
      init: decl.initializer ? compactWs(decl.initializer.getText(sf)) : "",
    };
  }
  return null;
}

function shapesOfText(text) {
  const sf = parseTs(text);
  const shapes = [];
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) || ts.isEmptyStatement(stmt)) continue;
    const shape = nodeShape(stmt, sf);
    if (!shape) return null;
    shapes.push(shape);
  }
  return shapes;
}

/**
 * @param {string} reportBlock
 * @param {string} sourceBlock
 */
export function declarationsEquivalent(reportBlock, sourceBlock) {
  if (!reportBlock || !sourceBlock) return false;
  const report = shapesOfText(reportBlock);
  const source = shapesOfText(sourceBlock);
  if (!report || !source || report.length === 0 || report.length !== source.length) return false;
  return report.every((shape, i) => JSON.stringify(shape) === JSON.stringify(source[i]));
}

function namedDecls(stmt, sf) {
  /** @type {{ name: string, text: string }[]} */
  const out = [];
  const text = stmt.getText(sf);
  if (ts.isFunctionDeclaration(stmt) && stmt.name) out.push({ name: stmt.name.text, text });
  else if (ts.isInterfaceDeclaration(stmt) || ts.isClassDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) || ts.isEnumDeclaration(stmt)) {
    out.push({ name: stmt.name.text, text });
  } else if (ts.isVariableStatement(stmt)) {
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name)) out.push({ name: decl.name.text, text });
    }
  }
  return out;
}

/**
 * @param {string} text
 * @param {string} path
 */
function parseSourceFile(text, path = "file.ts") {
  const sf = parseTs(text, path);
  /** @type {Map<string, string>} */
  const all = new Map();
  /** @type {Map<string, string>} */
  const locals = new Map();
  const overloaded = new Set();
  /** @type {{ from: string, names: '*' | { exported: string, original: string }[] }[]} */
  const reexports = [];

  for (const stmt of sf.statements) {
    if (ts.isExportDeclaration(stmt)) continue;
    const exported = isExported(stmt);
    for (const { name, text: block } of namedDecls(stmt, sf)) {
      all.set(name, block);
      if (!exported) continue;
      // shortcut: duplicate exported names (overloads, merges) are not
      // catch-up; a changeset is required.
      if (locals.has(name) || overloaded.has(name)) {
        locals.delete(name);
        overloaded.add(name);
      } else {
        locals.set(name, block);
      }
    }
  }
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt)) continue;
    if (stmt.exportClause && ts.isNamespaceExport(stmt.exportClause)) continue;
    const from =
      stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier) ? stmt.moduleSpecifier.text : "";
    if (!stmt.exportClause) {
      if (from) reexports.push({ from, names: "*" });
      continue;
    }
    if (!ts.isNamedExports(stmt.exportClause)) continue;
    const names = stmt.exportClause.elements.map((el) => ({
      original: (el.propertyName ?? el.name).text,
      exported: el.name.text,
    }));
    if (from) {
      // shortcut: `export { hidden as visible }` is not catch-up. Register
      // only same-name specifiers so the original local stays non-public.
      reexports.push({
        from,
        names: names.filter((n) => n.exported === n.original),
      });
    } else {
      for (const { original, exported } of names) {
        if (exported !== original) continue;
        const block = all.get(original);
        if (block && !locals.has(exported)) locals.set(exported, block);
      }
    }
  }
  return { locals, reexports };
}

/**
 * @param {Record<string, string>} files
 * @param {string} entry
 * @returns {Map<string, string>}
 */
export function resolvePublicDeclarations(files, entry) {
  /** @type {Map<string, { locals: Map<string, string>, reexports: { from: string, names: '*' | { exported: string, original: string }[] }[] }>} */
  const parsed = new Map();
  for (const [path, text] of Object.entries(files)) {
    parsed.set(posix.normalize(path), parseSourceFile(text, path));
  }
  const publicDecls = new Map();
  const visiting = new Set();

  /**
   * @param {string} path
   * @param {Set<string> | null} only
   */
  function take(path, only) {
    const file = parsed.get(posix.normalize(path));
    if (!file || visiting.has(path)) return;
    visiting.add(path);
    for (const [name, block] of file.locals) {
      if ((!only || only.has(name)) && !publicDecls.has(name)) publicDecls.set(name, block);
    }
    for (const reexport of file.reexports) {
      const target = resolveSourceImport(path, reexport.from, files);
      if (!target) continue;
      if (reexport.names === "*") {
        take(target, only);
        continue;
      }
      const wanted = new Set();
      for (const { exported, original } of reexport.names) {
        if (exported !== original) continue;
        if (only && !only.has(exported)) continue;
        wanted.add(exported);
      }
      if (wanted.size > 0) take(target, wanted);
    }
    visiting.delete(path);
  }

  if (entry && parsed.has(posix.normalize(entry))) take(entry, null);
  return publicDecls;
}

/**
 * @param {string} fromFile
 * @param {string} spec
 * @param {Record<string, string>} files
 */
function resolveSourceImport(fromFile, spec, files) {
  const bare = spec.replace(/\.(js|mjs|cjs|ts|tsx|mts|cts)$/u, "");
  const base = posix.normalize(posix.join(posix.dirname(fromFile), bare));
  const candidates = [
    ...SOURCE_CANDIDATES.map((ext) => `${base}${ext}`),
    ...SOURCE_CANDIDATES.map((ext) => `${base}/index${ext}`),
  ];
  return candidates.find((path) => files[path] !== undefined) ?? null;
}

/**
 * @param {string} mainReport
 * @param {string} headReport
 * @param {string[]} addedNames
 */
export function remainderEqualsMain(mainReport, headReport, addedNames) {
  const mainBody = reportTsBody(mainReport);
  const stripped = stripNewImports(stripAddedDecls(reportTsBody(headReport), addedNames), mainBody);
  return normalizeBlanks(stripped) === normalizeBlanks(mainBody);
}

/**
 * @param {string} body
 * @param {string[]} addedNames
 */
function stripAddedDecls(body, addedNames) {
  const names = new Set(addedNames);
  const lines = body.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; ) {
    let j = i;
    while (j < lines.length && lines[j].trimStart().startsWith("//")) j += 1;
    const match = j < lines.length ? DECL_HEADER_RE.exec(lines[j]) : null;
    if (match && names.has(match[2])) {
      let start = j;
      while (start > i && lines[start - 1].trimStart().startsWith("//")) start -= 1;
      for (let k = i; k < start; k += 1) out.push(lines[k]);
      i = consumeBlockLines(lines, j);
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join("\n");
}

/**
 * @param {string} body
 * @param {string} mainBody
 */
function stripNewImports(body, mainBody) {
  const allowed = new Set(mainBody.split("\n").filter((line) => line.startsWith("import ")));
  return body
    .split("\n")
    .filter((line) => !line.startsWith("import ") || allowed.has(line))
    .join("\n");
}

function normalizeBlanks(text) {
  return `${text.replace(/\n{3,}/gu, "\n\n").replace(/^\n+/u, "").replace(/\n+$/u, "")}\n`;
}

/**
 * @param {{
 *   mainReport?: string,
 *   headReport?: string,
 *   mainSources?: Record<string, string>,
 *   entry?: string,
 *   kinds?: Set<string>,
 * }} input
 * @returns {{ ok: boolean, skip?: string, error?: string }}
 */
export function evaluateReportChange({
  mainReport = "",
  headReport = "",
  mainSources = {},
  entry = "src/index.ts",
  kinds = new Set(),
} = {}) {
  if (mainReport === headReport) return { ok: true };
  const mainDecls = parseReportDeclarations(mainReport);
  const headDecls = parseReportDeclarations(headReport);
  const removed = [...mainDecls.keys()].filter((name) => !headDecls.has(name));
  const changed = [...mainDecls.keys()].filter(
    (name) => headDecls.has(name) && headDecls.get(name) !== mainDecls.get(name),
  );
  const added = [...headDecls.keys()].filter((name) => !mainDecls.has(name));
  const headerChanged = changed.some(
    (name) => firstDeclLine(mainDecls.get(name)) !== firstDeclLine(headDecls.get(name)),
  );
  const sourceDecls = resolvePublicDeclarations(mainSources, entry);
  const catchUp =
    removed.length === 0 &&
    changed.length === 0 &&
    added.length > 0 &&
    remainderEqualsMain(mainReport, headReport, added) &&
    added.every((name) => declarationsEquivalent(headDecls.get(name) ?? "", sourceDecls.get(name) ?? ""));
  if (kinds.size === 0) {
    if (catchUp) return { ok: true, skip: "already-on-main" };
    return { ok: false, error: "add a changeset" };
  }
  if ((removed.length > 0 || headerChanged) && !kinds.has("minor") && !kinds.has("major")) {
    return { ok: false, error: "removed needs minor/major" };
  }
  return { ok: true };
}

function firstDeclLine(block) {
  return (block ?? "").split("\n")[0];
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

function isSourcePath(rel) {
  if (rel.includes("node_modules/") || rel.includes("/tests/") || rel.startsWith("tests/")) {
    return false;
  }
  if (/\.test\.(c|m)?tsx?$/u.test(rel)) return false;
  return /\.(ts|tsx|mts|cts)$/u.test(rel);
}

function readMainSources(pkg) {
  const list = git(["ls-tree", "-r", "--name-only", `origin/main:packages/${pkg}`]);
  if (list.status !== 0) return {};
  /** @type {Record<string, string>} */
  const files = {};
  for (const rel of list.stdout.split("\n").filter(Boolean)) {
    if (!isSourcePath(rel)) continue;
    const shown = git(["show", `origin/main:packages/${pkg}/${rel}`]);
    if (shown.status === 0) files[rel] = shown.stdout;
  }
  return files;
}

/**
 * @param {string} typesEntry
 * @param {Record<string, string>} files
 */
export function pickSourceEntry(typesEntry, files) {
  const stems = [];
  if (typesEntry.startsWith("dist/")) {
    const rest = typesEntry.slice("dist/".length).replace(/\.d\.ts$/u, "");
    for (const ext of SOURCE_CANDIDATES) stems.push(`src/${rest}${ext}`);
  } else {
    stems.push(typesEntry);
    stems.push(typesEntry.replace(/\.d\.mts$/u, ".mts"), typesEntry.replace(/\.d\.ts$/u, ".ts"));
  }
  return stems.find((path) => files[path] !== undefined) ?? "";
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
  const sourceCache = new Map();
  for (const spec of specs) {
    const [pkg, typesEntry, report] = spec.split("|");
    const path = `packages/${pkg}/etc/${report}`;
    const npmPkg = `@zedtech/zedkit-${pkg}`;
    const existed = git(["cat-file", "-e", `origin/main:${path}`]);
    if (existed.status !== 0) continue;
    const mainShown = git(["show", `origin/main:${path}`]);
    const headShown = git(["show", `HEAD:${path}`]);
    const mainReport = mainShown.status === 0 ? mainShown.stdout : "";
    const headReport = headShown.status === 0 ? headShown.stdout : "";
    if (!sourceCache.has(pkg)) sourceCache.set(pkg, readMainSources(pkg));
    const mainSources = sourceCache.get(pkg);
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources,
      entry: pickSourceEntry(typesEntry, mainSources),
      kinds: bumps.get(npmPkg) ?? new Set(),
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
    console.log(`${path}: API report exact catch-up of public declarations already on origin/main`);
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
