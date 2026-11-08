#!/usr/bin/env node
// The npm that `pnpm publish` actually runs (Changesets → pnpm → runNpm),
// not whatever `npm` is first on the inherited PATH.
// pnpm 9.15.9 createEnv PATH: <cwd>/node_modules/.bin : dirname(execPath) : $PATH
// Official OIDC floor: npm >= 11.5.1, Node >= 22.14.0 (docs.npmjs.com/trusted-publishers).
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const MIN_NODE = "22.14.0";
export const MIN_NPM = "11.5.1";
/** Current npm 11 line (≥ 11.5.1). Stay off npm 12 for this publisher. */
export const PINNED_NPM = "11.21.2";

/**
 * @param {string} raw
 * @returns {[number, number, number] | null}
 */
export function parseVersion(raw) {
  const match = String(raw)
    .trim()
    .replace(/^v/u, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/u);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 */
export function versionGte(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

/**
 * PATH pnpm 9.15.9 runNpm/createEnv builds for the npm subprocess.
 * @param {{ execPath: string, cwd: string, pathEnv: string, delimiter?: string }} opts
 */
export function publisherPath(opts) {
  const delimiter = opts.delimiter ?? (process.platform === "win32" ? ";" : ":");
  return [join(opts.cwd, "node_modules", ".bin"), dirname(opts.execPath), opts.pathEnv].join(delimiter);
}

/**
 * @param {string} pathEnv
 * @param {{ delimiter?: string, exists?: (p: string) => boolean, names?: string[] }} [opts]
 */
export function resolveNpmOnPath(pathEnv, opts = {}) {
  const delimiter = opts.delimiter ?? (process.platform === "win32" ? ";" : ":");
  const exists = opts.exists ?? existsSync;
  const names = opts.names ?? (process.platform === "win32" ? ["npm.cmd", "npm"] : ["npm"]);
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = join(dir, name);
      if (exists(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Resolve npm the way the real publisher does: empty pack cwd (no local
 * node_modules/.bin/npm), then dirname(execPath), then inherited PATH.
 * @param {{ execPath: string, pathEnv: string, delimiter?: string, exists?: (p: string) => boolean }} opts
 */
export function resolvePublisherNpm(opts) {
  return resolveNpmOnPath(
    publisherPath({
      execPath: opts.execPath,
      cwd: opts.packCwd ?? "/tmp/pnpm-publish-pack-empty",
      pathEnv: opts.pathEnv,
      delimiter: opts.delimiter,
    }),
    { delimiter: opts.delimiter, exists: opts.exists },
  );
}

/**
 * @param {{ nodeVersion: string, npmVersion: string, npmPath: string | null }} input
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkReleasePublisher(input) {
  const errors = [];
  const node = parseVersion(input.nodeVersion);
  const minNode = parseVersion(MIN_NODE);
  if (!node) errors.push(`unreadable Node version ${JSON.stringify(input.nodeVersion)}`);
  else if (!versionGte(node, minNode)) {
    errors.push(`Node ${input.nodeVersion} is below OIDC minimum ${MIN_NODE}`);
  }
  if (!input.npmPath) {
    errors.push("publisher PATH did not resolve npm (pnpm prepends dirname(execPath))");
  } else {
    const npm = parseVersion(input.npmVersion);
    const minNpm = parseVersion(MIN_NPM);
    if (!npm) errors.push(`unreadable npm version ${JSON.stringify(input.npmVersion)}`);
    else if (!versionGte(npm, minNpm)) {
      errors.push(`publisher npm ${input.npmVersion} at ${input.npmPath} is below OIDC minimum ${MIN_NPM}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function readNpmVersion(npmPath) {
  return execFileSync(npmPath, ["--version"], { encoding: "utf8" }).trim();
}

export function inspectReleasePublisher({
  execPath = process.execPath,
  nodeVersion = process.version,
  pathEnv = process.env.PATH ?? "",
} = {}) {
  const npmPath = resolvePublisherNpm({ execPath, pathEnv });
  const npmVersion = npmPath ? readNpmVersion(npmPath) : "";
  const result = checkReleasePublisher({ nodeVersion, npmVersion, npmPath });
  return { npmPath, npmVersion, nodeVersion, execPath, nodeDir: dirname(execPath), ...result };
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  const report = inspectReleasePublisher();
  console.log(`release-publisher: node=${report.execPath} ${report.nodeVersion}`);
  console.log(`release-publisher: npm=${report.npmPath ?? "(unresolved)"} ${report.npmVersion || "(none)"}`);
  if (!report.ok) {
    for (const msg of report.errors) console.error(`release-publisher: ${msg}`);
    process.exit(1);
  }
  console.log(`release-publisher: ok (npm >= ${MIN_NPM}, Node >= ${MIN_NODE})`);
}
