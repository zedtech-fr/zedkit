// Original work by the same author.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import type { Provider } from "./install.js";

const PRETTIER_CONFIG = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  "prettier.config.js",
  "prettier.config.mjs",
] as const;

function kitPrettierIgnoreCandidates(
  providers: readonly Provider[] | undefined,
): string[] {
  const all = providers === undefined;
  const paths = [".agents/"];
  if (all || providers.some((p) => p === "cursor")) {
    paths.push(".cursor/skills/", ".cursor/agents/", ".cursor/commands/");
  }
  if (all || providers.some((p) => p === "claude")) {
    paths.push(".claude/");
  }
  return paths;
}

function prettierIgnoreLines(root: string): string[] {
  const file = join(root, ".prettierignore");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function covered(line: string, path: string): boolean {
  const p = path.replace(/\/$/, "");
  const r = line.replace(/\/$/, "");
  return r === p || p.startsWith(`${r}/`);
}

export function kitPathsMissingFromPrettierIgnore(
  root: string,
  providers: readonly Provider[] | undefined,
): string[] {
  const ignore = prettierIgnoreLines(root);
  return kitPrettierIgnoreCandidates(providers).filter(
    (path) => !ignore.some((line) => covered(line, path)),
  );
}

function hasPrettierConfigFile(root: string): boolean {
  return PRETTIER_CONFIG.some((name) => existsSync(join(root, name)));
}

function packageJsonSignalsPrettier(root: string): boolean {
  const pkg = join(root, "package.json");
  if (!existsSync(pkg)) return false;
  const parsed = tryCatch(
    () =>
      JSON.parse(readFileSync(pkg, "utf8")) as {
        devDependencies?: Record<string, string>;
        dependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      },
  );
  if (!parsed.ok) return false;
  const j = parsed.value;
  const deps = { ...j.dependencies, ...j.devDependencies };
  if (
    Object.keys(deps).some((k) => k === "prettier" || k.startsWith("prettier-"))
  )
    return true;
  return Object.values(j.scripts ?? {}).some((s) => /\bprettier\b/u.test(s));
}

export function repoUsesPrettier(root: string): boolean {
  return packageJsonSignalsPrettier(root) || hasPrettierConfigFile(root);
}

/** `prettier:` hint lines when the repo uses prettier and kit paths are missing from .prettierignore. */
export function prettierHintLines(
  root: string,
  providers: readonly Provider[] | undefined,
): string[] {
  if (!repoUsesPrettier(root)) return [];
  const missing = kitPathsMissingFromPrettierIgnore(root, providers);
  if (missing.length === 0) return [];
  return ["prettier: add to .prettierignore:", ...missing];
}

/** One line when `zk-<name>` sits beside `<name>` under this agents dir. Commands still run `<name>`. */
export function adoptReconcileLines(agentsDir: string): string[] {
  const skills = join(agentsDir, "skills");
  const listed = tryCatch(() => readdirSync(skills, { withFileTypes: true }));
  if (!listed.ok) return [];
  const names = new Set(
    listed.value
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );
  const sidecars = [...names]
    .filter(
      (name) => name.startsWith("zk-") && names.has(name.slice("zk-".length)),
    )
    .sort();
  if (sidecars.length === 0) return [];
  return [
    `adopt: slash commands still run your old skill names (${sidecars.join(", ")}). Diff skills/<name> with skills/zk-<name>, keep one, delete the other, and set name: back to <name>`,
  ];
}

/** Lines printed after a successful init/setup (not dry-run). */
export function installNextStepLines(
  root: string,
  providers: readonly Provider[] | undefined,
): string[] {
  // Setup artifacts already exist: do not send the user back to /zedkit-ai setup.
  const lines = existsSync(join(root, ".agents", "product.md"))
    ? ["next: validate, then score the setup"]
    : [
        "next: run /zedkit-ai (or the setup-ai skill), then npx @zedtech/zedkit-ai validate",
        "note: setup and validate do not write product.md; /zedkit-ai adds product.md, domain/*.md, personas.md, design.md, glossary — .agents/skills/setup-ai/templates/README.md",
        "note: /zedkit-ai (or the setup-ai skill) reads the code first with read-only subagents (npx @zedtech/zedkit-ai scan sizes them), asks only what the code cannot answer, and writes domain rules, nested AGENTS.md and .agents/tokenomics.md, then runs zedkit-ai sync",
      ];
  if (
    existsSync(join(root, "pnpm-workspace.yaml")) &&
    !existsSync(join(root, "node_modules"))
  ) {
    lines.push("next: pnpm install (workspace deps missing)");
  }
  lines.push(...adoptReconcileLines(join(root, ".agents")));
  lines.push(...prettierHintLines(root, providers));
  return lines;
}
