// Preview coverage check: every docs example that renders JSX must show a
// live preview next to its code, or be explicitly excused.
//
// Sources checked:
//   - catalog examples (docs/catalog/catalog.json): the first example is
//     covered by the page demo (manifest `demo`); any other example needs a
//     manifest `examples: { "<title>": "<DemoKey>" }` mapping;
//   - guide fences (apps/docs/prose/**/*.mdx): a tsx/jsx fence with JSX
//     needs `preview="<DemoKey>"` (renders that registry demo above the
//     fence) or `no-preview="<reason>"` in its meta, or a pending entry.
//
// Excuses live in apps/docs/preview-coverage.json:
//   - nonVisualPackages: packages whose snippets never render UI;
//   - optOut: { "<key>": "<reason>" } for legit non-visual snippets
//     (JSON-LD, config, hooks, types) — the reason is mandatory;
//   - pending: ["<key>"] — the shrinking baseline of known gaps. An entry
//     that now has a preview (or no longer exists) fails the check, so the
//     list can only go down.
//
// Keys: "<need heading>::<example title>" and "guide:<file>::<fence title>".
// Usage: `node scripts/check-previews.mjs` (add `--list` to print gaps).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expandGuideSnippets } from "./generate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

// JSX element start: `<Name` not preceded by an identifier char or a closing
// bracket, so generics (`useState<string>`) and comparisons do not count.
const JSX = /(?<![\w)\]])<[A-Za-z]/;

export function hasJsx(code) {
  const body = code
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line))
    .join("\n");
  return JSX.test(body);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith(".mdx")) yield path;
  }
}

const FENCE = /^```(tsx|jsx|ts|js)([^\n]*)\n([\s\S]*?)^```/gm;

export function guideFences(proseDir) {
  const found = [];
  if (!existsSync(proseDir)) return found;
  for (const file of walk(proseDir)) {
    const text = expandGuideSnippets(readFileSync(file, "utf8"));
    const base = file.slice(proseDir.length + 1).replace(/\.mdx$/, "");
    let index = 0;
    for (const match of text.matchAll(FENCE)) {
      index += 1;
      const [, , meta, body] = match;
      if (!hasJsx(body)) continue;
      const title = meta.match(/title="([^"]+)"/)?.[1] ?? `fence ${index}`;
      const reason = meta.match(/no-preview="([^"]+)"/)?.[1] ?? null;
      const preview = meta.match(/ preview="([^"]+)"/)?.[1] ?? null;
      found.push({ key: `guide:${base}::${title}`, reason, preview });
    }
  }
  return found;
}

export function collectGaps({ catalog, rich, config, proseDir, demoKeys = null }) {
  const nonVisual = new Set(config.nonVisualPackages ?? []);
  const optOut = config.optOut ?? {};
  const pending = new Set(config.pending ?? []);
  const errors = [];
  const gaps = [];
  const known = new Set();

  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    if (nonVisual.has(pkg)) continue;
    for (const need of entry.needs) {
      const examples = need.examples ?? [{ title: "Simple", code: need.example ?? "" }];
      const spec = rich[need.need];
      examples.forEach((example, index) => {
        if (!hasJsx(example.code)) return;
        const key = `${need.need}::${example.title}`;
        known.add(key);
        const covered = Boolean(spec && (index === 0 || spec.examples?.[example.title]));
        if (covered) {
          if (pending.has(key)) errors.push(`pending "${key}" now has a preview: remove it from preview-coverage.json.`);
          if (key in optOut) errors.push(`optOut "${key}" now has a preview: remove it from preview-coverage.json.`);
          return;
        }
        if (key in optOut || pending.has(key)) return;
        gaps.push(key);
      });
      for (const title of Object.keys(spec?.examples ?? {})) {
        if (!examples.some((example) => example.title === title)) {
          errors.push(`docs-manifest.json: "${need.need}" maps a preview to unknown example "${title}".`);
        }
      }
    }
  }

  for (const fence of guideFences(proseDir)) {
    known.add(fence.key);
    if (fence.preview) {
      if (demoKeys && !demoKeys.has(fence.preview)) {
        errors.push(`${fence.key}: preview="${fence.preview}" is not a demo in components/demos/registry.ts.`);
      }
      if (pending.has(fence.key)) errors.push(`pending "${fence.key}" now has a preview: remove it from preview-coverage.json.`);
      if (fence.key in optOut) errors.push(`optOut "${fence.key}" now has a preview: remove it from preview-coverage.json.`);
      continue;
    }
    if (fence.reason) {
      if (pending.has(fence.key)) errors.push(`pending "${fence.key}" is opted out in its fence: remove it from preview-coverage.json.`);
      continue;
    }
    if (fence.key in optOut || pending.has(fence.key)) continue;
    gaps.push(fence.key);
  }

  for (const [key, reason] of Object.entries(optOut)) {
    if (!String(reason).trim()) errors.push(`optOut "${key}" needs a reason.`);
    if (!known.has(key)) errors.push(`optOut "${key}" matches no JSX example.`);
  }
  for (const key of pending) {
    if (!known.has(key)) errors.push(`pending "${key}" matches no JSX example: remove it from preview-coverage.json.`);
  }
  return { gaps, errors };
}

function registryDemoKeys() {
  const source = readFileSync(join(APP, "components", "demos", "registry.ts"), "utf8");
  return new Set([...source.matchAll(/^ {2}([A-Za-z0-9]+): \{ Demo:/gm)].map((match) => match[1]));
}

function main() {
  const catalog = JSON.parse(readFileSync(join(ROOT, "docs", "catalog", "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
  const config = JSON.parse(readFileSync(join(APP, "preview-coverage.json"), "utf8"));
  const { gaps, errors } = collectGaps({
    catalog,
    rich: manifest.rich ?? {},
    config,
    proseDir: join(APP, "prose"),
    demoKeys: registryDemoKeys(),
  });
  if (process.argv.includes("--list")) {
    console.log(JSON.stringify(gaps.sort(), null, 2));
    return;
  }
  for (const key of gaps) {
    errors.push(
      `"${key}" renders JSX with no live preview. Add a demo (manifest "examples" / page demo), or excuse it in preview-coverage.json (optOut with a reason, or a guide fence meta preview="DemoKey" or no-preview="reason").`,
    );
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(`preview-coverage: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`preview-coverage: ok (${(config.pending ?? []).length} pending, ${Object.keys(config.optOut ?? {}).length} opted out).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
