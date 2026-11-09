/**
 * Rewrites kit UI relative imports for a shadcn consumer app (`@/lib/utils`,
 * `@/components/ui/*`). Only used when generating registry payloads; library
 * sources stay unchanged. Resolve the importer's actual target, then map that
 * file to its declared consumer destination. Only `packages/ui/src/utils.ts`
 * may receive `@/lib/utils`.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const RELATIVE_FROM = /from\s+["']((?:\.\.?\/)+[^"']+\.js)["']/g;
const CANONICAL_UTILS_ALIAS = "@/lib/utils";
const TARGET_EXTS = [".ts", ".tsx"];

function addDestination(destinations, used, filePath, alias) {
  const abs = resolve(filePath);
  const owner = used.get(alias);
  if (owner && owner !== abs) {
    throw new Error(`registry import ambiguous mapping: ${alias} from ${owner} and ${abs}`);
  }
  used.set(alias, abs);
  destinations.set(abs, alias);
}

/** Map each source file to the consumer module it may be rewritten to. */
export function consumerDestinations({ canonicalUtils, staged }) {
  const destinations = new Map();
  const used = new Map();
  addDestination(destinations, used, canonicalUtils, CANONICAL_UTILS_ALIAS);
  for (const [filePath, stem] of staged) {
    if (resolve(filePath) === resolve(canonicalUtils)) continue;
    addDestination(destinations, used, filePath, `@/components/ui/${stem}`);
  }
  return destinations;
}

export function resolveImportTarget(importerPath, specifier) {
  const stripped = specifier.replace(/\.js$/, "");
  const base = resolve(dirname(importerPath), stripped);
  const hits = TARGET_EXTS.map((ext) => `${base}${ext}`).filter((path) => existsSync(path));
  if (hits.length === 0) {
    throw new Error(`registry import missing target: ${specifier} from ${importerPath}`);
  }
  if (hits.length > 1) {
    throw new Error(`registry import ambiguous target: ${specifier} from ${importerPath} matches ${hits.join(", ")}`);
  }
  return resolve(hits[0]);
}

export function rewriteUiImports(source, { importerPath, destinations, resolveTarget = resolveImportTarget }) {
  const mapped = source
    .replace(/from\s+["']@zedtech\/zedkit-i18n\/react["']/g, 'from "@/components/ui/create-messages-context"')
    .replace(/from\s+["']@zedtech\/zedkit-i18n["']/g, 'from "@/components/ui/format-message"');
  return mapped.replace(RELATIVE_FROM, (_full, specifier) => {
    const target = resolveTarget(importerPath, specifier);
    const dest = destinations.get(target);
    if (!dest) {
      throw new Error(`registry import undeclared helper: ${specifier} -> ${target}`);
    }
    return `from "${dest}"`;
  });
}
