#!/usr/bin/env node
// Choose publish auth for Changesets → pnpm 9.15.9 → npm.
// A configured NPM_TOKEN becomes NODE_AUTH_TOKEN on GITHUB_ENV.
// Empty/absent leaves NODE_AUTH_TOKEN unset (empty is ENEEDAUTH).
// npm 11.21.2 oidc() never throws: no Trusted Publisher → fall through to the token.
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {unknown} npmToken
 * @returns {{ ok: true, mode: "token" | "oidc", nodeAuthToken: string | null, error: null } | { ok: false, mode: null, nodeAuthToken: null, error: string }}
 */
export function selectReleaseAuth(npmToken) {
  if (typeof npmToken === "string" && npmToken.length > 0) {
    if (/[\r\n]/u.test(npmToken)) {
      return { ok: false, mode: null, nodeAuthToken: null, error: "NPM_TOKEN must be a single line" };
    }
    return { ok: true, mode: "token", nodeAuthToken: npmToken, error: null };
  }
  return { ok: true, mode: "oidc", nodeAuthToken: null, error: null };
}

/** @param {{ ok: boolean, mode: "token" | "oidc" | null, nodeAuthToken: string | null }} selection */
export function githubEnvBody(selection) {
  if (!selection.ok || !selection.mode) return "";
  if (selection.mode === "token") {
    return `RELEASE_AUTH_MODE=token\nNODE_AUTH_TOKEN=${selection.nodeAuthToken}\n`;
  }
  return "RELEASE_AUTH_MODE=oidc\n";
}

/**
 * Apply GITHUB_ENV assignments the way the runner does for the next step.
 * @param {Record<string, string | undefined>} stepEnv
 * @param {string} githubEnvText
 */
export function applyGithubEnv(stepEnv, githubEnvText) {
  const next = { ...stepEnv };
  for (const line of githubEnvText.split("\n")) {
    if (!line) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    next[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return next;
}

/**
 * Env pnpm 9.15.9 runNpm passes to npm publish: createEnv copies process.env
 * then rewrites PATH; getEnvWithTokens only adds *:tokenHelper keys.
 * NODE_AUTH_TOKEN therefore reaches npm if and only if the Changesets step has it.
 * @param {Record<string, string | undefined>} stepEnv
 */
export function pnpmNpmPublishEnv(stepEnv) {
  return { ...stepEnv };
}

export function applyReleaseAuth(stepEnv, npmToken) {
  const selection = selectReleaseAuth(npmToken);
  if (!selection.ok) return { selection, childEnv: { ...stepEnv } };
  const childEnv = pnpmNpmPublishEnv(applyGithubEnv(stepEnv, githubEnvBody(selection)));
  return { selection, childEnv };
}

function main() {
  const selection = selectReleaseAuth(process.env.NPM_TOKEN);
  if (!selection.ok) {
    console.error(`export-release-auth: ${selection.error}`);
    process.exit(1);
  }
  console.log(`export-release-auth: mode=${selection.mode}`);
  const githubEnv = process.env.GITHUB_ENV;
  if (githubEnv) appendFileSync(githubEnv, githubEnvBody(selection));
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main();
}
