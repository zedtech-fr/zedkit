#!/usr/bin/env node
// Pack the runtime workspace closure of a public @zedtech package so a
// fresh consumer can install this checkout's tarballs before those
// versions exist on npm. Walks dependencies and peerDependencies only
// (devDependencies such as @zedtech/zedkit-quality stay off the
// consumer graph).
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function runtimeWorkspaceNames(pkg, byName) {
  return Object.keys({
    ...(pkg.dependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  }).filter((name) => byName.has(name));
}

function readWorkspacePackages(root) {
  const byName = new Map();
  const packages = join(root, "packages");
  if (!existsSync(packages)) return byName;
  for (const entry of readdirSync(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(packages, entry.name);
    const pkgPath = join(dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (!pkg.name) continue;
    byName.set(pkg.name, { dir, pkg });
  }
  return byName;
}

/** Public workspace packages needed to install `names`, including `names`. */
export function workspaceInstallClosure(names, root = ROOT) {
  const wanted = [...new Set(Array.isArray(names) ? names : [names])];
  const byName = readWorkspacePackages(root);
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    const entry = byName.get(name);
    if (!entry) return;
    seen.add(name);
    runtimeWorkspaceNames(entry.pkg, byName).forEach(visit);
  };
  for (const name of wanted) {
    if (!byName.has(name)) {
      throw new Error(`unknown workspace package ${name}`);
    }
    visit(name);
  }
  return [...seen].sort();
}

export function tarballForPackage(dest, packageName) {
  const slug = packageName.replace(/^@/, "").replaceAll("/", "-");
  const files = readdirSync(dest).filter((file) => file.endsWith(".tgz") && file.startsWith(`${slug}-`));
  if (files.length !== 1) {
    throw new Error(`expected one tarball for ${packageName} in ${dest}, got ${files.join(",") || "none"}`);
  }
  return join(dest, files[0]);
}

export function packWorkspacePackages(names, dest, root = ROOT) {
  mkdirSync(dest, { recursive: true });
  const byName = readWorkspacePackages(root);
  const tarballs = {};
  for (const name of names) {
    const entry = byName.get(name);
    if (!entry) throw new Error(`no packages/* folder for ${name}`);
    execFileSync("pnpm", ["pack", "--pack-destination", dest], {
      cwd: entry.dir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    tarballs[name] = tarballForPackage(dest, name);
  }
  return tarballs;
}

function pnpmMajor(project) {
  return Number(execFileSync("pnpm", ["--version"], { cwd: project, encoding: "utf8" }).trim().split(".")[0]);
}

/** Point a consumer at packed tarballs so pnpm does not look them up on npm. */
export function overridePackages(project, tarballs) {
  const overrides = Object.fromEntries(Object.entries(tarballs).map(([name, file]) => [name, `file:${file}`]));
  if (pnpmMajor(project) >= 10) {
    const lines = Object.entries(overrides).map(([name, spec]) => `  "${name}": "${spec}"`);
    appendFileSync(join(project, "pnpm-workspace.yaml"), `overrides:\n${lines.join("\n")}\n`);
    return;
  }
  const pkgPath = join(project, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides: { ...(pkg.pnpm?.overrides ?? {}), ...overrides } };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function packAndOverride(packageName, project, dest, root = ROOT) {
  const tarballs = packWorkspacePackages(workspaceInstallClosure(packageName, root), dest, root);
  overridePackages(project, tarballs);
  return tarballs;
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, packageName, project, dest] = process.argv.slice(2);
  if (cmd !== "pack-and-override" || !packageName || !project || !dest) {
    process.stderr.write("usage: node scripts/workspace-pack-closure.mjs pack-and-override <packageName> <projectDir> <packDest>\n");
    process.exitCode = 1;
  } else {
    const tarballs = packAndOverride(packageName, project, dest);
    for (const file of Object.values(tarballs)) process.stdout.write(`${file}\n`);
  }
}
