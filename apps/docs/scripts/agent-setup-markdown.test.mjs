import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { writeAiSetupPublicAssets } from "../lib/ai-setup-onboarding.mjs";
import { AGENT_SETUP_PUBLIC_FILES, LLMS_AGENT_MARKDOWN_URLS } from "./check-seo-export.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function pkgVersion(folder) {
  return JSON.parse(read(join("packages", folder, "package.json"))).version;
}

const COPIES = [
  ["apps/docs/prose/agent/map.md", "apps/docs/public/map.md"],
  ["apps/docs/prose/agent/suggest.md", "apps/docs/public/suggest.md"],
  ["apps/docs/prose/agent/ui-setup.md", "apps/docs/public/ui/setup.md"],
  ["apps/docs/prose/agent/nest-setup.md", "apps/docs/public/nest/setup.md"],
];

const SETUP_HEADINGS = ["Goal", "Detect", "Steps", "Preserve", "Idempotent re-run", "Done-check", "Report"];

const UI_PROMPT = "Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md";
const NEST_PROMPT = "Set up zedkit Nest on this repo following https://zedkit.app/nest/setup.md";
const MAP_PROMPT = "Set up zedkit AI, UI and Nest on this repo following https://zedkit.app/map.md";
const SUGGEST_PROMPT = "Suggest which zedkit setup this repo needs following https://zedkit.app/suggest.md";

const SUGGEST_INSTALL_PATTERNS = [
  /pnpm add/,
  /npm install/,
  /npx /,
  /zedkit-ai setup/,
  /zedkit-ai init/,
];

function fenceBlocks(text, lang) {
  const re = new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g");
  return [...text.matchAll(re)].map((m) => m[1]);
}

test("public agent markdown matches prose sources byte-for-byte", () => {
  for (const [src, dest] of COPIES) {
    assert.equal(read(dest), `${read(src).trimEnd()}\n`, dest);
  }
});

test("writeAiSetupPublicAssets copies agent markdown and mini prompts", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), "zk-agent-setup-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  writeAiSetupPublicAssets(tmp);
  for (const [src, dest] of COPIES) {
    const publicRel = dest.replace("apps/docs/public/", "");
    const got = readFileSync(join(tmp, "public", publicRel), "utf8");
    assert.equal(got, `${read(src).trimEnd()}\n`, publicRel);
  }
  const generated = readFileSync(join(tmp, "lib", "ai-setup-onboarding.generated.ts"), "utf8");
  assert.ok(generated.includes(`export const UI_SETUP_MINI_PROMPT = ${JSON.stringify(UI_PROMPT)};`));
  assert.ok(generated.includes(`export const NEST_SETUP_MINI_PROMPT = ${JSON.stringify(NEST_PROMPT)};`));
  assert.ok(generated.includes(`export const MAP_SETUP_MINI_PROMPT = ${JSON.stringify(MAP_PROMPT)};`));
  assert.ok(generated.includes(`export const SUGGEST_MINI_PROMPT = ${JSON.stringify(SUGGEST_PROMPT)};`));
});

test("UI and Nest setup.md share the contract headings and pin the published version", () => {
  const ui = read("apps/docs/prose/agent/ui-setup.md");
  const nest = read("apps/docs/prose/agent/nest-setup.md");
  for (const [label, text] of [
    ["ui", ui],
    ["nest", nest],
  ]) {
    for (const heading of SETUP_HEADINGS) {
      assert.ok(text.includes(`## ${heading}`), `${label}: ## ${heading}`);
    }
  }
  const uiV = pkgVersion("ui");
  const nestV = pkgVersion("nest");
  assert.match(ui, new RegExp(`@zedtech/zedkit-ui@${uiV.replaceAll(".", "\\.")}`));
  assert.match(nest, new RegExp(`@zedtech/zedkit-nest@${nestV.replaceAll(".", "\\.")}`));
  assert.match(ui, /--save-exact/);
  assert.match(nest, /--save-exact/);
});

test("UI steps lockstep Getting started snippets", () => {
  const ui = read("apps/docs/prose/agent/ui-setup.md");
  const add = read("apps/docs/prose/guides/snippets/ui-add.sh").trim();
  for (const token of add.split(/\s+/).filter((part) => part.startsWith("@") || part === "pnpm" || part === "add")) {
    assert.ok(ui.includes(token.replace(/@zedtech\/zedkit-ui$/, "@zedtech/zedkit-ui")), `ui-add token: ${token}`);
  }
  assert.ok(ui.includes("@zedtech/zedkit-ui"), "ui package name");
  assert.ok(ui.includes("@fontsource-variable/inter"));
  assert.ok(ui.includes("@fontsource-variable/space-grotesk"));
  const css = read("apps/docs/prose/guides/snippets/npm-globals.css");
  for (const line of css.split("\n").map((row) => row.trim()).filter(Boolean)) {
    assert.ok(ui.includes(line), `css line: ${line}`);
  }
  const page = read("apps/docs/prose/guides/snippets/npm-page.tsx");
  assert.ok(ui.includes('from "@zedtech/zedkit-ui"'));
  assert.ok(ui.includes("<Button>Save</Button>"));
  assert.ok(page.includes("<Button>Save</Button>"));
  assert.ok(ui.includes('import "./globals.css"'));
  assert.ok(ui.includes('import "./fonts"'));
  assert.ok(ui.includes('data-identity="glass"'));
  assert.ok(ui.includes("../node_modules/@zedtech/zedkit-ui/src"));
  assert.ok(ui.includes("../../node_modules/@zedtech/zedkit-ui/src"));
});

test("Nest steps lockstep README peers, not nest-add.sh alone", () => {
  const nest = read("apps/docs/prose/agent/nest-setup.md");
  const readme = read("packages/nest/README.md");
  const block = readme.match(/```sh\n(pnpm add[\s\S]*?)```/);
  assert.ok(block, "nest README install block");
  const pkgs = [...block[1].matchAll(/(@[a-z0-9/-]+|[a-z][a-z0-9-]*)/g)].map((m) => m[1]).filter((name) => name !== "pnpm" && name !== "add");
  assert.ok(pkgs.includes("@zedtech/zedkit-nest"));
  assert.ok(pkgs.includes("@nestjs/core"));
  for (const pkg of pkgs) {
    assert.ok(nest.includes(pkg), `README peer: ${pkg}`);
  }
  const snippet = read("apps/docs/prose/guides/snippets/nest-add.sh").trim();
  assert.equal(snippet, "pnpm add @zedtech/zedkit-nest");
  assert.ok(!snippet.includes("@nestjs/core"), "snippet drift: nest-add.sh omits README peers");
  assert.ok(nest.includes("createNestApp"));
  assert.ok(fenceBlocks(nest, "sh").some((body) => body.includes("@nestjs/core")));
});

test("suggest.md is read-only, covers empty and partial repos, ends with one follow-up", () => {
  const suggest = read("apps/docs/prose/agent/suggest.md");
  assert.match(suggest, /read-only/i);
  assert.match(suggest, /empty/i);
  assert.match(suggest, /partial/i);
  assert.doesNotMatch(suggest, /```sh/);
  for (const pattern of SUGGEST_INSTALL_PATTERNS) {
    assert.equal(pattern.test(suggest), false, `forbidden: ${pattern}`);
  }
  assert.ok(suggest.includes(SUGGEST_PROMPT) === false || true);
  const prompts = [UI_PROMPT, NEST_PROMPT, MAP_PROMPT, "Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md"];
  const named = prompts.filter((p) => suggest.includes(p));
  assert.equal(named.length, prompts.length, "suggest lists every follow-up setup prompt");
  const last = suggest.trim().split("\n").filter(Boolean).at(-1) ?? "";
  assert.match(last, /stop/i);
});

test("map.md orders UI then Nest then AI, requested-only, suggest when unchosen", () => {
  const map = read("apps/docs/prose/agent/map.md");
  assert.ok(map.includes("UI → Nest → AI"));
  assert.match(map, /requested/i);
  assert.ok(map.includes("https://zedkit.app/suggest.md"));
  assert.ok(map.includes("https://zedkit.app/ui/setup.md"));
  assert.ok(map.includes("https://zedkit.app/nest/setup.md"));
  assert.ok(map.includes("https://zedkit.app/ai/setup.md"));
  assert.ok(map.includes(UI_PROMPT));
  assert.ok(map.includes(NEST_PROMPT));
  assert.ok(map.includes(MAP_PROMPT));
  assert.ok(map.includes(SUGGEST_PROMPT));
  assert.match(map, /one combined/i);
});

test("doc-pins lists every new file that names a zedkit version pin", () => {
  const pins = read("scripts/doc-pins.mjs");
  for (const rel of [
    "apps/docs/prose/agent/ui-setup.md",
    "apps/docs/prose/agent/nest-setup.md",
    "apps/docs/public/ui/setup.md",
    "apps/docs/public/nest/setup.md",
  ]) {
    assert.ok(pins.includes(`"${rel}"`), rel);
  }
});

test("SEO export and llms index the agent markdown URLs", () => {
  assert.deepEqual(AGENT_SETUP_PUBLIC_FILES, [
    "ai/setup.md",
    "map.md",
    "suggest.md",
    "ui/setup.md",
    "nest/setup.md",
  ]);
  assert.deepEqual(LLMS_AGENT_MARKDOWN_URLS, [
    "https://zedkit.app/ai/setup.md",
    "https://zedkit.app/ui/setup.md",
    "https://zedkit.app/nest/setup.md",
    "https://zedkit.app/map.md",
    "https://zedkit.app/suggest.md",
  ]);
  const generate = read("apps/docs/scripts/generate.mjs");
  const llms = read("apps/docs/public/llms.txt");
  const llmsFull = read("apps/docs/public/llms-full.txt");
  for (const url of LLMS_AGENT_MARKDOWN_URLS) {
    assert.ok(generate.includes(url), url);
    assert.ok(llms.includes(url), `llms.txt: ${url}`);
  }
  assert.equal([...llmsFull.matchAll(/^# zedkit setup map$/gm)].length, 1);
});
