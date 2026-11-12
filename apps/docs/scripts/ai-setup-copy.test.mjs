import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const { aiSetupCopy } = await import("../features/docs/i18n/ai-setup-copy.ts");

const TITLE = join(app, "features/docs/mdx/ui/ai-setup-page-title.tsx");
const PROMPT = join(app, "features/docs/mdx/ui/ai-setup-prompt.tsx");

test("AI setup copy pins today's English", () => {
  assert.equal(aiSetupCopy.title.prefix, "Set up zedkit AI in");
  assert.equal(aiSetupCopy.title.h1Label, "Set up zedkit AI in Cursor, Muse, Claude, or your choice");
  assert.deepEqual(aiSetupCopy.title.words, ["Cursor", "Muse", "Claude", "your choice"]);
  assert.equal(aiSetupCopy.title.lead, "Give your coding agent one prompt to set up zedkit AI in your project.");
  assert.equal(
    aiSetupCopy.prompt.pasteBefore,
    "Paste this as the only message in a new chat at the repo root (Cursor, Muse, Claude Code, or your tool — agents should fetch",
  );
  assert.equal(aiSetupCopy.prompt.pasteAfter, "):");
  assert.equal(aiSetupCopy.prompt.walkthroughLead, "Full walkthrough:");
  assert.equal(aiSetupCopy.prompt.copyWhat, "Agent setup prompt");
});

test("AI setup copy keys have no join space, markup, or generated URLs", () => {
  const strings = [
    aiSetupCopy.title.prefix,
    aiSetupCopy.title.h1Label,
    aiSetupCopy.title.lead,
    ...aiSetupCopy.title.words,
    aiSetupCopy.prompt.pasteBefore,
    aiSetupCopy.prompt.pasteAfter,
    aiSetupCopy.prompt.walkthroughLead,
    aiSetupCopy.prompt.copyWhat,
  ];
  for (const value of strings) {
    assert.equal(value, value.trim(), value);
    assert.doesNotMatch(value, /<[a-zA-Z/]/);
    assert.doesNotMatch(value, /https?:\/\//);
    assert.doesNotMatch(value, /\/docs\//);
  }
});

test("title component interpolates catalog keys and drops in-file English", () => {
  const src = readFileSync(TITLE, "utf8");
  assert.match(src, /aiSetupCopy\.title\.prefix/);
  assert.match(src, /aria-label=\{aiSetupCopy\.title\.h1Label\}/);
  assert.match(src, /aiSetupCopy\.title\.words/);
  assert.match(src, /aiSetupCopy\.title\.lead/);
  assert.doesNotMatch(src, /AI_SETUP_PAGE_H1_LABEL/);
  assert.doesNotMatch(src, /Set up zedkit AI in Cursor, Muse, Claude, or your choice/);
  assert.doesNotMatch(src, /Give your coding agent one prompt to set up zedkit AI in your project\./);
});

test("prompt component interpolates catalog keys and keeps generated URLs", () => {
  const src = readFileSync(PROMPT, "utf8");
  assert.match(src, /aiSetupCopy\.prompt\.pasteBefore/);
  assert.match(src, /aiSetupCopy\.prompt\.pasteAfter/);
  assert.match(src, /aiSetupCopy\.prompt\.walkthroughLead/);
  assert.match(src, /aiSetupCopy\.prompt\.copyWhat/);
  assert.match(src, /AI_SETUP_LLMS_URL/);
  assert.match(src, /AI_SETUP_DOCS_PATH/);
  assert.match(src, /AI_SETUP_MINI_PROMPT/);
  assert.match(src, /adoptionCopy\.copyLabel/);
  assert.doesNotMatch(src, /Paste this as the only message in a new chat/);
  assert.doesNotMatch(src, /Full walkthrough:/);
  assert.doesNotMatch(src, /Agent setup prompt/);
});
