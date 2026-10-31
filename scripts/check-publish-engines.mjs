#!/usr/bin/env node
// R33: every public package tarball must declare the same Node engine as the repo.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Matches root package.json engines.node and CI node-version. */
export const REQUIRED_NODE_ENGINE = ">=22";

/**
 * @param {string} rootDir
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkPublishEngines(rootDir) {
  const packagesDir = join(rootDir, "packages");
  const errors = [];
  for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const pkgPath = join(packagesDir, dir.name, "package.json");
    if (!existsSync(pkgPath)) {
      errors.push(`${dir.name}/package.json: missing`);
      continue;
    }
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (pkg.private === true) continue;
    const name = pkg.name ?? dir.name;
    const node = pkg.engines?.node;
    if (node !== REQUIRED_NODE_ENGINE) {
      errors.push(
        `${name}: engines.node must be ${JSON.stringify(REQUIRED_NODE_ENGINE)} (got ${JSON.stringify(node ?? null)})`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  const result = checkPublishEngines(root);
  if (!result.ok) {
    for (const msg of result.errors) console.error(msg);
    process.exit(1);
  }
  console.log(`check-publish-engines: ok (${REQUIRED_NODE_ENGINE})`);
}
