import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const { homeSameIdeaCopy } = await import("./home-same-idea-copy.ts");
const catalogSrc = readFileSync(join(here, "home-same-idea-copy.ts"), "utf8");
const { lands, kitCounts } = homeSameIdeaCopy;

test("same-idea lands heading is the day-one kit benefit, not an inventory title", () => {
  assert.equal(lands.heading, "A working kit in your repo on day one.");
  assert.doesNotMatch(catalogSrc, /What lands in your repo/);
});

test("same-idea lands proof interpolates live counts and ends with MIT", () => {
  assert.equal(
    lands.proof(0, 0, 0, 0),
    "The agent can plan, review and ship with 0 skills, 0 agents, 0 components and 0 looks. MIT.",
  );
  assert.equal(
    lands.proof(1, 1, 1, 1),
    "The agent can plan, review and ship with 1 skills, 1 agents, 1 components and 1 looks. MIT.",
  );
  assert.equal(
    lands.proof(kitCounts.skills, kitCounts.agents, 7, kitCounts.looks),
    `The agent can plan, review and ship with ${kitCounts.skills} skills, ${kitCounts.agents} agents, 7 components and ${kitCounts.looks} looks. MIT.`,
  );
  assert.doesNotMatch(catalogSrc, /46 skills/);
});

test("same-idea lands catalog drops unused chip labels", () => {
  assert.equal("skills" in lands, false);
  assert.equal("agents" in lands, false);
  assert.equal("components" in lands, false);
  assert.equal("looks" in lands, false);
  assert.equal("mit" in lands, false);
});
