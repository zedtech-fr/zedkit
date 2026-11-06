import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkAgentIcons, mappingKey } from "./check-agent-icons.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");
const lucide = { Search: {}, Blocks: {}, Ghost: {} };

function sourceFor(body, imports = "Search, Blocks") {
  return `import { ${imports} } from "lucide-react";\n\nexport const AGENT_ICONS = {\n${body}\n};\n`;
}

test("mappingKey matches quoted and unquoted keys", () => {
  const source = sourceFor('  explorer: Search,\n  "ui-designer": Blocks,');
  assert.equal(mappingKey(source, "explorer"), true);
  assert.equal(mappingKey(source, "ui-designer"), true);
  assert.equal(mappingKey(source, "ghost"), false);
});

test("checkAgentIcons is silent when kit and mapping match", () => {
  const errors = checkAgentIcons({
    agents: ["explorer", "architect"],
    source: sourceFor("  explorer: Search,\n  architect: Blocks,"),
    lucide,
  });
  assert.deepEqual(errors, []);
});

test("checkAgentIcons reports a kit agent with no mapping", () => {
  const errors = checkAgentIcons({
    agents: ["explorer", "architect"],
    source: sourceFor("  explorer: Search,"),
    lucide,
  });
  assert.deepEqual(errors, ['agent-icons: missing mapping for kit agent "architect"']);
});

test("checkAgentIcons reports a mapping that is not in kit.json", () => {
  const errors = checkAgentIcons({
    agents: ["explorer"],
    source: sourceFor("  explorer: Search,\n  architect: Blocks,"),
    lucide,
  });
  assert.deepEqual(errors, ['agent-icons: extra mapping "architect" not in kit.json']);
});

test("checkAgentIcons reports a lucide import that does not exist", () => {
  const errors = checkAgentIcons({
    agents: ["explorer"],
    source: sourceFor("  explorer: Search,", "Search, NotARealIcon"),
    lucide,
  });
  assert.deepEqual(errors, ['agent-icons: lucide-react has no export "NotARealIcon"']);
});

test("checkAgentIcons reports an icon used without a lucide import", () => {
  const errors = checkAgentIcons({
    agents: ["explorer"],
    source: sourceFor("  explorer: Ghost,", "Search"),
    lucide,
  });
  assert.deepEqual(errors, [
    "agent-icons: mapping uses Ghost but it is not imported from lucide-react",
  ]);
});

test("checkAgentIcons reports a missing lucide-react import block", () => {
  const errors = checkAgentIcons({
    agents: ["explorer"],
    source: "export const AGENT_ICONS = {\n  explorer: Search,\n};\n",
    lucide,
  });
  assert.deepEqual(errors, ["agent-icons: missing lucide-react import block"]);
});

test("the live kit.json mapping has no agent-icon errors", () => {
  const require = createRequire(join(APP, "package.json"));
  const liveLucide = require("lucide-react");
  const kit = JSON.parse(readFileSync(join(ROOT, "packages", "ai", "kit", "kit.json"), "utf8"));
  const source = readFileSync(join(APP, "lib", "agent-icons.ts"), "utf8");
  assert.deepEqual(checkAgentIcons({ agents: kit.agents, source, lucide: liveLucide }), []);
});
