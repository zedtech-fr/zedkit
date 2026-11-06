import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkDomainIcons } from "./check-domain-icons.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const lucide = { LayoutDashboard: {}, Server: {}, Ghost: {} };

function sourceFor(body, imports = "LayoutDashboard, Server") {
  return `import { ${imports} } from "lucide-react";\n\nexport const DOMAIN_ICONS = {\n${body}\n};\n`;
}

test("checkDomainIcons is silent when home cards and mapping match", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI", "Core & server"],
    source: sourceFor('  "Build a UI": LayoutDashboard,\n  "Core & server": Server,'),
    lucide,
  });
  assert.deepEqual(errors, []);
});

test("checkDomainIcons reports a home card with no mapping", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI", "Core & server"],
    source: sourceFor('  "Build a UI": LayoutDashboard,'),
    lucide,
  });
  assert.deepEqual(errors, ['domain-icons: missing mapping for home card "Core & server"']);
});

test("checkDomainIcons reports a mapping that is not a home card", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI"],
    source: sourceFor('  "Build a UI": LayoutDashboard,\n  "Core & server": Server,'),
    lucide,
  });
  assert.deepEqual(errors, ['domain-icons: extra mapping "Core & server" not in home-entry-points.json']);
});

test("checkDomainIcons reports a lucide import that does not exist", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI"],
    source: sourceFor('  "Build a UI": LayoutDashboard,', "LayoutDashboard, NotARealIcon"),
    lucide,
  });
  assert.deepEqual(errors, ['domain-icons: lucide-react has no export "NotARealIcon"']);
});

test("checkDomainIcons reports an icon used without a lucide import", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI"],
    source: sourceFor('  "Build a UI": Ghost,', "LayoutDashboard"),
    lucide,
  });
  assert.deepEqual(errors, [
    "domain-icons: mapping uses Ghost but it is not imported from lucide-react",
  ]);
});

test("checkDomainIcons reports a missing lucide-react import block", () => {
  const errors = checkDomainIcons({
    titles: ["Build a UI"],
    source: 'export const DOMAIN_ICONS = {\n  "Build a UI": LayoutDashboard,\n};\n',
    lucide,
  });
  assert.deepEqual(errors, ["domain-icons: missing lucide-react import block"]);
});

test("the live home-entry-points mapping has no domain-icon errors", () => {
  const require = createRequire(join(APP, "package.json"));
  const liveLucide = require("lucide-react");
  const cards = JSON.parse(readFileSync(join(APP, "home-entry-points.json"), "utf8"));
  const source = readFileSync(join(APP, "lib", "domain-icons.ts"), "utf8");
  assert.deepEqual(
    checkDomainIcons({ titles: cards.map((row) => row.title), source, lucide: liveLucide }),
    [],
  );
});
