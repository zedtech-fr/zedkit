import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..");

function read(rel) {
  return readFileSync(join(DOCS, rel), "utf8");
}

const GENERATED_NAMES = {
  ai: "AI_SETUP_MINI_PROMPT",
  ui: "UI_SETUP_MINI_PROMPT",
  combined: "MAP_SETUP_MINI_PROMPT",
  suggest: "SUGGEST_MINI_PROMPT",
};

function exportedString(source, name) {
  const match = source.match(new RegExp(`export const ${name} = ("(?:\\\\.|[^"\\\\])*");`));
  assert.ok(match, `generated export ${name}`);
  return JSON.parse(match[1]);
}

test("setup entry catalog lists four generated prompts and no Nest-only paste", () => {
  const generated = read("lib/ai-setup-onboarding.generated.ts");
  const catalog = read("features/docs/setup-entry-prompts.ts");
  const surfaces = [
    ["catalog", catalog],
    ["wrapper", read("features/docs/mdx/ui/setup-entry-prompt.tsx")],
    ["home lead", read("app/(home)/_home/home-hero-lead.tsx")],
    ["home illustration", read("app/(home)/_home/home-hero-illustration.tsx")],
    ["home band", read("app/(home)/_home/sections/home-paste-section.tsx")],
    ["home closing", read("app/(home)/_home/sections/home-closing-section.tsx")],
    ["getting started", read("prose/guides/getting-started.mdx")],
    ["home smoke", read("tests/home-ai-setup.spec.ts")],
    ["getting started smoke", read("tests/getting-started.spec.ts")],
  ];
  const nestBody = exportedString(generated, "NEST_SETUP_MINI_PROMPT");

  for (const [id, name] of Object.entries(GENERATED_NAMES)) {
    const body = exportedString(generated, name);
    assert.match(catalog, new RegExp(`\\b${name}\\b`), `${id} references ${name}`);
    assert.match(catalog, new RegExp(`id: "${id}"`), `catalog id ${id}`);
    for (const [label, source] of surfaces) {
      assert.equal(source.includes(body), false, `${label} must not literal-copy ${name}`);
    }
  }

  assert.equal(catalog.includes("NEST_SETUP_MINI_PROMPT"), false);
  assert.equal(catalog.includes(nestBody), false);
  for (const [label, source] of surfaces) {
    assert.equal(source.includes("NEST_SETUP_MINI_PROMPT"), false, `${label} must omit Nest-only`);
  }

  const ids = [...catalog.matchAll(/id: "(ai|ui|combined|suggest)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, ["ai", "ui", "combined", "suggest"]);

  const homeLead = read("app/(home)/_home/home-hero-lead.tsx");
  const homeBand = read("app/(home)/_home/sections/home-paste-section.tsx");
  const homeClosing = read("app/(home)/_home/sections/home-closing-section.tsx");
  const homePrompt = exportedString(generated, "MAP_AI_UI_SETUP_MINI_PROMPT");
  assert.equal(homePrompt.includes("\n"), false);
  assert.match(homeLead, /\bMAP_AI_UI_SETUP_MINI_PROMPT\b/);
  assert.doesNotMatch(homeLead, /\bMAP_SETUP_MINI_PROMPT\b|\bAI_SETUP_MINI_PROMPT\b|\bUI_SETUP_MINI_PROMPT\b/);
  assert.doesNotMatch(homeLead, /SetupEntryPrompt/);
  assert.equal((homeLead.match(/data-home-hero-prompt/g) ?? []).length, 1);
  assert.doesNotMatch(homeBand, /SetupEntryPrompt|SecretField|data-setup-entry/);
  assert.doesNotMatch(homeBand, /\bMAP_SETUP_MINI_PROMPT\b|\bMAP_AI_UI_SETUP_MINI_PROMPT\b|\bAI_SETUP_MINI_PROMPT\b|\bUI_SETUP_MINI_PROMPT\b|\bSUGGEST_MINI_PROMPT\b/);
  assert.doesNotMatch(homeClosing, /SetupEntryPrompt|data-setup-entry/);
  assert.match(homeClosing, /HomeCopyCommandField/);
  assert.doesNotMatch(homeClosing, /SecretField/);
  assert.match(homeClosing, /\bMAP_AI_UI_SETUP_MINI_PROMPT\b/);
  assert.doesNotMatch(homeClosing, /\bMAP_SETUP_MINI_PROMPT\b|\bAI_SETUP_MINI_PROMPT\b|\bUI_SETUP_MINI_PROMPT\b|\bSUGGEST_MINI_PROMPT\b/);

  for (const [label, source] of [
    ["home lead", homeLead],
    ["home closing", homeClosing],
    ["home smoke", read("tests/home.spec.ts")],
    ["home paste smoke", read("tests/home-ai-setup.spec.ts")],
  ]) {
    assert.equal(source.includes(homePrompt), false, `${label} must not literal-copy MAP_AI_UI_SETUP_MINI_PROMPT`);
  }

  const wrapper = read("features/docs/mdx/ui/setup-entry-prompt.tsx");
  assert.match(wrapper, /<Label htmlFor=\{fieldId\}>\{entry\.label\}<\/Label>/);
  assert.doesNotMatch(wrapper, /labelled|aria-label/);
});
