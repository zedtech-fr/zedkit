import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const HOST = join(HERE, "setup-map", "host");
const UI_SETUP = join(HERE, "..", "prose", "agent", "ui-setup.md");
const UI_PKG = join(ROOT, "packages", "ui", "package.json");
const CLI_JS = join(ROOT, "packages", "ai", "dist", "cli.js");
const UI_NAME = "@zedtech/zedkit-ui";

function fenceBlocks(text, lang) {
  const re = new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g");
  return [...text.matchAll(re)].map((m) => m[1]);
}

function pickFence(markdown, lang, needle) {
  const block = fenceBlocks(markdown, lang).find((body) => body.includes(needle));
  if (!block) throw new Error(`ui-setup.md missing ${lang} fence for ${needle}`);
  return block;
}

function uiPackageVersion() {
  return JSON.parse(readFileSync(UI_PKG, "utf8")).version;
}

function readCss(dest) {
  return readFileSync(join(dest, "src/app/globals.css"), "utf8");
}

function uiWiringPresent(dest, version) {
  const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8"));
  if (pkg.dependencies?.[UI_NAME] !== version) return false;
  const css = readCss(dest);
  return css.includes(`@import "${UI_NAME}/styles.css"`) && css.includes(`${UI_NAME}/src`);
}

function pinUi(dest, version) {
  const path = join(dest, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.dependencies = { ...pkg.dependencies, [UI_NAME]: version };
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function copyHost() {
  const dest = mkdtempSync(join(tmpdir(), "zedkit-setup-map-"));
  cpSync(HOST, dest, { recursive: true });
  return dest;
}

export function applyUiSetup(dest) {
  const version = uiPackageVersion();
  if (uiWiringPresent(dest, version)) return;
  const markdown = readFileSync(UI_SETUP, "utf8");
  writeFileSync(join(dest, "src/app/globals.css"), pickFence(markdown, "css", `../../node_modules/${UI_NAME}/src`));
  writeFileSync(join(dest, "src/app/fonts.ts"), pickFence(markdown, "ts", "@fontsource-variable/inter"));
  writeFileSync(join(dest, "src/app/layout.tsx"), pickFence(markdown, "tsx", 'data-identity="glass"'));
  pinUi(dest, version);
}

export function assertUiDoneCheck(dest) {
  const version = uiPackageVersion();
  const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8"));
  assert.equal(pkg.dependencies[UI_NAME], version);
  const css = readCss(dest);
  assert.ok(css.includes(`@import "${UI_NAME}/styles.css"`));
  assert.ok(css.includes(`${UI_NAME}/src`));
}

async function loadMain(cliJs = CLI_JS) {
  if (!existsSync(cliJs)) throw new Error("build `@zedtech/zedkit-ai` first");
  const loaded = await import(pathToFileURL(cliJs).href);
  return loaded.main;
}

async function runMain(argv, cliJs) {
  const main = await loadMain(cliJs);
  const out = [];
  const err = [];
  const code = main(argv, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

export function runAiSetup(dest, cliJs) {
  return runMain(["setup", dest, "--provider", "cursor"], cliJs);
}

export function runValidate(dest, cliJs) {
  return runMain(["validate", dest], cliJs);
}

export function assertValidateOk(result) {
  if (result.code !== 0) {
    throw new Error(`validate failed: code=${result.code} out=${result.out} err=${result.err}`);
  }
  const lines = result.out
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  const okLines = lines.filter((line) => line.startsWith("ok — structural kit checks only"));
  if (okLines.length !== 1) {
    throw new Error(`validate changed contract: ${result.out}`);
  }
  if (!okLines[0].includes("NOT checked by validate")) {
    throw new Error(`validate missing scope disclaimer: ${result.out}`);
  }
  const deprecation =
    /^commands\/[\w.-]+\.md: warning: command "[\w.-]+" is deprecated; use \/zedkit-ai/;
  const unexpected = lines.filter((line) => line !== okLines[0] && !deprecation.test(line));
  if (unexpected.length > 0) {
    throw new Error(`validate unexpected output: ${unexpected.join("\n")}`);
  }
}
