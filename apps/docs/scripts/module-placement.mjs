import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, posix } from "node:path";
import ts from "typescript";

export const SHARED_OWNER = "docs";

// Directory globs absorb new dead/single-owner files. Do not add under them.
// Drop a glob from this list when that lot moves. File paths are exact.
export const REQUIRED_GLOBS = [
  "ui/home/**",
  "ui/docs-main-content.tsx",
];

// No remaining required cross-feature edges. prose/guides → features/docs and
// mdx-components.tsx → features/docs are allowed (docs-domain UI); other
// features stay banned.
export const REQUIRED_EDGES = [];

const GRAPH_DIRS = ["app", "features", "components", "lib", "ui"];
const SOURCE_EXT = new Set([".ts", ".tsx", ".mjs", ".js", ".jsx", ".mdx"]);
const RESOLVE_EXT = [".ts", ".tsx", ".mjs", ".js", ".jsx", ".mdx"];
const ROUTE_STEMS = new Set(["page", "layout", "route", "not-found", "opengraph-image", "sitemap", "robots"]);
const SKIP_DIR = new Set(["node_modules", "dist", "out", ".next", ".source", "coverage"]);
const DOCS_WRITTEN = [
  "features/docs/ui/component-page",
  "features/docs/ui/component-preview",
  "components/maturity-badge",
  "components/props-table",
  "features/docs/ui/component-wraps-line",
];

function posixPath(file) {
  return file.split("\\").join("/");
}

function isTestFile(file) {
  return /\.(?:test|spec)\./.test(posixPath(file).split("/").pop() ?? "");
}

function isDemoFile(file) {
  return posixPath(file).startsWith("components/demos/");
}

function isSharedCheck(file) {
  const n = posixPath(file);
  if (isDemoFile(n) || isTestFile(n)) return false;
  return n.startsWith("components/") || n.startsWith("lib/") || n.startsWith("ui/");
}

function stem(file) {
  const base = posixPath(file).split("/").pop() ?? "";
  return base.replace(/\.(?:tsx|ts|jsx|js|mjs)$/, "");
}

export function isRouteFile(file) {
  const n = posixPath(file);
  return n.startsWith("app/") && ROUTE_STEMS.has(stem(n));
}

function isProseMdx(file) {
  return posixPath(file).startsWith("prose/") && file.endsWith(".mdx");
}

function inferRoots(files) {
  return files.filter((file) => isRouteFile(file) || isProseMdx(file) || posixPath(file) === "mdx-components.tsx");
}

function featureOf(file) {
  const m = posixPath(file).match(/^features\/([^/]+)\//);
  return m ? m[1] : null;
}

function privateFolder(file) {
  const n = posixPath(file);
  if (!n.startsWith("app/")) return null;
  const match = /^(app\/(?:.*\/)?)_([^/]+)\/(.*)$/.exec(n);
  if (!match) return null;
  const parent = match[1].endsWith("/") ? match[1].slice(0, -1) : match[1];
  return { parent, folder: `${parent}/_${match[2]}` };
}

function globMatches(glob, file) {
  const n = posixPath(file);
  const g = posixPath(glob);
  if (g.endsWith("/**")) {
    const prefix = g.slice(0, -3);
    return n === prefix || n.startsWith(`${prefix}/`);
  }
  return n === g;
}

function ownersByFile(graph) {
  const files = graph.files.map(posixPath);
  const fileSet = new Set(files);
  const forward = new Map();
  for (const file of files) forward.set(file, []);
  forward.set(SHARED_OWNER, []);
  for (const edge of graph.edges) {
    const from = posixPath(edge.from);
    const to = posixPath(edge.to);
    if (!fileSet.has(to)) continue;
    if (!forward.has(from)) forward.set(from, []);
    forward.get(from).push(to);
  }
  const roots = new Set([...(graph.roots ?? inferRoots(files)), SHARED_OWNER]);
  /** @type {Map<string, Set<string>>} */
  const owners = new Map();
  for (const file of files) owners.set(file, new Set());
  for (const root of roots) {
    /** @type {Map<string, Set<string>>} */
    const seen = new Map();
    /** @type {Array<{ cur: string, owner: string }>} */
    const queue = [{ cur: root, owner: root }];
    while (queue.length > 0) {
      const item = queue.pop();
      if (!item) continue;
      const { cur, owner } = item;
      const feat = featureOf(cur);
      // Paths that entered a feature count that feature as the owner, so a
      // lib file used only by one domain is single-owner (not many routes).
      // The synthetic `docs` owner stands in for the generated pages corpus
      // (`DOCS_WRITTEN`). Keep it when that walk enters a feature, otherwise
      // moving component-page into features/docs would retag every shared
      // module it reaches as a new single-owner violation.
      const nextOwner = owner === SHARED_OWNER ? SHARED_OWNER : feat ? `features/${feat}` : owner;
      const seenOwners = seen.get(cur) ?? new Set();
      if (seenOwners.has(nextOwner)) continue;
      seenOwners.add(nextOwner);
      seen.set(cur, seenOwners);
      if (fileSet.has(cur) && cur !== root) owners.get(cur)?.add(nextOwner);
      for (const next of forward.get(cur) ?? []) {
        queue.push({ cur: next, owner: nextOwner });
      }
    }
  }
  return owners;
}

function currentViolations(graph) {
  const files = graph.files.map(posixPath);
  const owners = ownersByFile(graph);
  /** @type {object[]} */
  const violations = [];
  for (const file of files) {
    if (!isSharedCheck(file)) continue;
    const owned = owners.get(file) ?? new Set();
    if (owned.size === 0) {
      violations.push({ kind: "dead", file });
      continue;
    }
    if (owned.size === 1) {
      const [owner] = owned;
      // Synthetic `docs` stands in for the generated pages corpus, not one route.
      if (owner !== SHARED_OWNER) violations.push({ kind: "single-owner", file });
    }
  }
  for (const edge of graph.edges) {
    const from = posixPath(edge.from);
    const to = posixPath(edge.to);
    const priv = privateFolder(to);
    if (priv && from !== SHARED_OWNER && from !== priv.parent && !from.startsWith(`${priv.parent}/`)) {
      violations.push({ kind: "private-leak", from, to, file: to });
    }
    const feat = featureOf(to);
    if (!feat) continue;
    const fromFeat = featureOf(from);
    if (fromFeat === feat || from.startsWith("app/") || from === SHARED_OWNER) continue;
    // Docs-guide MDX and getMDXComponents composing docs-feature UI are the
    // documented L7/L8a/L8b rules, not debt. Do not widen to other features.
    if (from.startsWith("prose/guides/") && feat === "docs") continue;
    if (from === "mdx-components.tsx" && feat === "docs") continue;
    if (fromFeat !== feat) {
      violations.push({ kind: "cross-feature", from, to, file: from });
    }
  }
  return violations;
}

function coveredByGlob(violation, globs) {
  const file = violation.file;
  if (!file) return false;
  if (violation.kind !== "dead" && violation.kind !== "single-owner") return false;
  return globs.some((glob) => globMatches(glob, file));
}

function sameEdge(a, b) {
  return posixPath(a.from) === posixPath(b.from) && posixPath(a.to) === posixPath(b.to);
}

/**
 * @param {{ files: string[], edges: Array<{ from: string, to: string }>, roots?: string[] }} graph
 * @param {{ dead?: string[], singleOwner?: string[], globs?: string[], edges?: Array<{ from: string, to: string }> }} baseline
 */
export function checkPlacement(graph, baseline = {}) {
  const dead = (baseline.dead ?? []).map(posixPath);
  const singleOwner = (baseline.singleOwner ?? []).map(posixPath);
  const globs = (baseline.globs ?? []).map(posixPath);
  const edges = baseline.edges ?? [];
  const current = currentViolations(graph);
  const newViolations = current.filter((v) => {
    if (coveredByGlob(v, globs)) return false;
    if (v.kind === "dead") return !dead.includes(v.file);
    if (v.kind === "single-owner") return !singleOwner.includes(v.file);
    if (v.kind === "cross-feature" || v.kind === "private-leak") {
      return !edges.some((e) => sameEdge(e, v));
    }
    return true;
  });
  /** @type {object[]} */
  const stale = [];
  for (const file of dead) {
    if (!current.some((v) => v.kind === "dead" && v.file === file)) stale.push({ kind: "dead", file });
  }
  for (const file of singleOwner) {
    if (!current.some((v) => v.kind === "single-owner" && v.file === file)) {
      stale.push({ kind: "single-owner", file });
    }
  }
  for (const glob of globs) {
    const absorbs = current.some((v) => coveredByGlob(v, [glob]));
    if (!absorbs) stale.push({ kind: "glob", glob });
  }
  for (const edge of edges) {
    if (
      !current.some(
        (v) => (v.kind === "cross-feature" || v.kind === "private-leak") && sameEdge(v, edge),
      )
    ) {
      stale.push({ kind: "edge", from: edge.from, to: edge.to, file: edge.from });
    }
  }
  return { newViolations, stale };
}

function walk(dir, base, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name) || name.startsWith(".")) continue;
    const path = join(dir, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(path, base, out);
    else if (SOURCE_EXT.has(extname(name)) && !isTestFile(name)) {
      out.push(posixPath(posix.relative(base, path)));
    }
  }
}

function importSpecifiers(source) {
  return ts.preProcessFile(source, true, true).importedFiles.map((entry) => entry.fileName);
}

function resolveImport(fromFile, spec, fileSet) {
  if (!spec || spec.startsWith("\0")) return null;
  let rel;
  if (spec.startsWith("@/")) rel = spec.slice(2);
  else if (spec.startsWith("#")) rel = `app/${spec.slice(1)}`;
  else if (spec.startsWith(".")) rel = posix.normalize(posix.join(posix.dirname(fromFile), spec));
  else return null;
  rel = posixPath(rel).replace(/^\.\//, "");
  const candidates = [rel];
  const stripped = rel.replace(/\.(?:tsx|ts|jsx|js|mjs|mdx)$/, "");
  if (stripped !== rel) candidates.push(stripped);
  for (const stemPath of [...candidates]) {
    for (const ext of RESOLVE_EXT) {
      candidates.push(`${stemPath}${ext}`);
      candidates.push(`${stemPath}/index${ext}`);
    }
  }
  for (const candidate of candidates) {
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

function addEdge(edges, from, to) {
  if (!to || from === to) return;
  if (edges.some((e) => e.from === from && e.to === to)) return;
  edges.push({ from, to });
}

/**
 * @param {string} docsRoot
 */
export function buildDocsGraph(docsRoot) {
  const files = [];
  for (const dir of GRAPH_DIRS) walk(join(docsRoot, dir), docsRoot, files);
  walk(join(docsRoot, "prose"), docsRoot, files);
  const mdxComponents = join(docsRoot, "mdx-components.tsx");
  if (existsSync(mdxComponents)) files.push("mdx-components.tsx");
  const fileSet = new Set(files);
  /** @type {Array<{ from: string, to: string }>} */
  const edges = [];
  for (const file of files) {
    const source = readFileSync(join(docsRoot, file), "utf8");
    for (const spec of importSpecifiers(source)) {
      addEdge(edges, file, resolveImport(file, spec, fileSet));
    }
  }
  const generateFile = join(docsRoot, "scripts/generate.mjs");
  if (existsSync(generateFile)) {
    const source = readFileSync(generateFile, "utf8");
    for (const spec of importSpecifiers(source)) {
      const resolved = resolveImport("scripts/generate.mjs", spec, fileSet);
      if (resolved?.startsWith("lib/")) addEdge(edges, SHARED_OWNER, resolved);
    }
    for (const written of DOCS_WRITTEN) {
      addEdge(edges, SHARED_OWNER, resolveImport("mdx-components.tsx", `@/${written}`, fileSet));
    }
  }
  const roots = [...inferRoots(files), SHARED_OWNER];
  return { files, edges, roots };
}

function sortIds(list) {
  return [...list].sort((a, b) => a.localeCompare(b));
}

export function landTimeBaseline(graph) {
  const current = currentViolations(graph);
  const globs = [...REQUIRED_GLOBS];
  const dead = sortIds(
    current.filter((v) => v.kind === "dead" && !coveredByGlob(v, globs)).map((v) => v.file),
  );
  const singleOwner = sortIds(
    current.filter((v) => v.kind === "single-owner" && !coveredByGlob(v, globs)).map((v) => v.file),
  );
  const edges = current
    .filter((v) => v.kind === "cross-feature" || v.kind === "private-leak")
    .map((v) => ({ from: v.from, to: v.to }))
    .sort((a, b) => `${a.from}\0${a.to}`.localeCompare(`${b.from}\0${b.to}`));
  return { dead, singleOwner, globs, edges };
}

export function baselineGrowth(committed, next) {
  const extra = [];
  for (const file of next.dead ?? []) {
    if (!(committed.dead ?? []).includes(file)) extra.push(`dead:${file}`);
  }
  for (const file of next.singleOwner ?? []) {
    if (!(committed.singleOwner ?? []).includes(file)) extra.push(`single-owner:${file}`);
  }
  for (const glob of next.globs ?? []) {
    if (!(committed.globs ?? []).includes(glob)) extra.push(`glob:${glob}`);
  }
  for (const edge of next.edges ?? []) {
    if (!(committed.edges ?? []).some((e) => sameEdge(e, edge))) {
      extra.push(`edge:${edge.from}->${edge.to}`);
    }
  }
  return extra;
}

export function writeLandTimeBaseline(docsRoot, baselinePath) {
  const graph = buildDocsGraph(docsRoot);
  const baseline = landTimeBaseline(graph);
  const absorbed = currentViolations(graph).filter((v) => coveredByGlob(v, baseline.globs)).length;
  if (baseline.dead.length === 0 && baseline.singleOwner.length === 0 && absorbed === 0) {
    throw new Error("placement walk found no shared-folder violations; resolver is likely wrong");
  }
  if (baseline.dead.length > 200) {
    throw new Error(`placement walk found ${baseline.dead.length} dead files; resolver is likely wrong`);
  }
  for (const edge of REQUIRED_EDGES) {
    if (!baseline.edges.some((e) => sameEdge(e, edge))) {
      throw new Error(`placement walk missed required edge ${edge.from} -> ${edge.to}`);
    }
  }
  if (existsSync(baselinePath)) {
    const committed = JSON.parse(readFileSync(baselinePath, "utf8"));
    const growth = baselineGrowth(committed, baseline);
    if (growth.length > 0) {
      throw new Error(
        `placement baseline may only shrink; --write-baseline refuses:\n${growth.join("\n")}\nMove the file; never extend the baseline.`,
      );
    }
  }
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  return { graph, baseline };
}

const invoked = process.argv[1] && posixPath(process.argv[1]).endsWith("module-placement.mjs");
if (invoked && process.argv.includes("--write-baseline")) {
  const docsRoot = join(import.meta.dirname, "..");
  const out = writeLandTimeBaseline(docsRoot, join(import.meta.dirname, "module-placement.baseline.json"));
  process.stdout.write(
    `dead=${out.baseline.dead.length} singleOwner=${out.baseline.singleOwner.length} edges=${out.baseline.edges.length}\n`,
  );
}
