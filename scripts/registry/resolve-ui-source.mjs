import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const SKIP_NAME = /\.(?:test|spec|stories)\./;
const SOURCE_EXT = /\.(tsx|ts)$/;

export function stemOf(fileName) {
  return fileName.replace(/\.(tsx|ts)$/, "");
}

function add(map, key, path) {
  const list = map.get(key) ?? [];
  list.push(path);
  map.set(key, list);
}

/** Walk package source trees. Callers fail on 0 or >1 hits for a requested name. */
export function indexSources(roots) {
  const byFileName = new Map();
  const byStem = new Map();

  const visit = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith(".")) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        visit(path);
        continue;
      }
      if (SKIP_NAME.test(name) || !SOURCE_EXT.test(name)) continue;
      add(byFileName, name, path);
      add(byStem, stemOf(name), path);
    }
  };

  for (const root of roots) visit(root);
  return { byFileName, byStem };
}

export function resolveUniqueSource(index, fileName) {
  const matches = index.byFileName.get(fileName) ?? [];
  if (matches.length === 0) {
    throw new Error(`registry source missing: ${fileName}`);
  }
  if (matches.length > 1) {
    throw new Error(`registry source ambiguous: ${fileName} matches ${matches.join(", ")}`);
  }
  return matches[0];
}

/** Staged bricks must not share an import stem with another source (button.ts vs button.tsx). */
export function assertUniqueStems(index, fileNames) {
  for (const fileName of fileNames) {
    const stem = stemOf(fileName);
    const paths = index.byStem.get(stem) ?? [];
    const names = new Set(paths.map((path) => basename(path)));
    if (names.size > 1) {
      throw new Error(`registry source ambiguous mapping: ${stem} matches ${paths.join(", ")}`);
    }
  }
}

