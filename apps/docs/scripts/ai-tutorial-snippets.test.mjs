import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const SNIPPETS = join(ROOT, "apps", "docs", "prose", "guides", "snippets");
const FIXTURE = readFileSync(join(ROOT, "apps", "docs", "fixtures", "ai-agent-tutorial.mjs"), "utf8");

function snippet(name) {
  return readFileSync(join(SNIPPETS, name), "utf8").trim();
}

/** argv arrays the fixture actually runs: capture([...]) string literals. */
function fixtureArgv() {
  const runs = [];
  for (const m of FIXTURE.matchAll(/capture\(\[([^\]]*)\]/g)) {
    runs.push([...m[1].matchAll(/"([^"]*)"/g)].map((t) => t[1]));
  }
  assert.ok(runs.length > 0, "fixture runs at least one CLI command");
  return runs;
}

test("tutorial snippets are canonical one-liners", () => {
  assert.equal(snippet("ai-add.sh"), "pnpm add -D @zedtech/zedkit-ai");
  assert.equal(snippet("ai-tutorial-list.sh"), "npx @zedtech/zedkit-ai list");
  assert.equal(snippet("ai-tutorial-init.sh"), "npx @zedtech/zedkit-ai init . --provider cursor --preset full");
  assert.equal(snippet("ai-tutorial-validate.sh"), "npx @zedtech/zedkit-ai validate");
});

test("the fixture runs every scratch-runnable tutorial command", () => {
  const runs = fixtureArgv();
  // ai-add.sh needs the network registry; the rest must run in scratch.
  for (const name of ["ai-tutorial-list.sh", "ai-tutorial-init.sh", "ai-tutorial-validate.sh"]) {
    const tokens = snippet(name)
      .replace(/^npx @zedtech\/zedkit-ai /, "")
      .split(/\s+/)
      .filter((t) => t !== ".");
    const covered = runs.some((argv) => tokens.every((t) => argv.includes(t)));
    assert.ok(covered, `${name} (${tokens.join(" ")}) is run by the fixture`);
  }
});
